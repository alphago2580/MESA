// Discord 이벤트 핸들러

import { verifyDiscordSignature } from './utils/discord-api';
import { addIssueComment, createIssue } from './utils/github-api';
import { getIssueFromPost } from './utils/mapping';

interface Env {
  MAPPING: KVNamespace;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
}

interface DiscordInteraction {
  type: number;
  token: string;
  application_id: string;
  channel_id?: string;
  channel?: {
    id: string;
    parent_id?: string;
    type: number;
  };
  member?: {
    user: {
      id: string;
      username: string;
      global_name?: string;
    };
  };
  user?: {
    id: string;
    username: string;
    global_name?: string;
  };
  data?: {
    name: string;
    options?: Array<{ name: string; value: string; options?: Array<{ name: string; value: string }> }>;
    custom_id?: string;
    components?: Array<{
      type: number;
      components: Array<{
        type: number;
        custom_id: string;
        value: string;
      }>;
    }>;
  };
  message?: {
    id: string;
    content: string;
    channel_id: string;
  };
}

// Discord Interaction 타입
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  MODAL_SUBMIT: 5,
};

// Discord Response 타입
const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  MODAL: 9,
};

export async function handleDiscordRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // 서명 검증
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();

  if (!signature || !timestamp) {
    return new Response('Missing signature headers', { status: 401 });
  }

  const isValid = await verifyDiscordSignature(
    env.DISCORD_PUBLIC_KEY,
    signature,
    timestamp,
    body
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const interaction: DiscordInteraction = JSON.parse(body);

  // PING 응답 (Discord가 URL 검증할 때 사용)
  if (interaction.type === InteractionType.PING) {
    return jsonResponse({ type: InteractionResponseType.PONG });
  }

  // 슬래시 커맨드 처리
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    return await handleCommand(interaction, env, ctx);
  }

  // Modal 제출 처리
  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    return await handleModalSubmit(interaction, env, ctx);
  }

  return new Response('Unknown interaction type', { status: 400 });
}

async function handleCommand(
  interaction: DiscordInteraction,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const commandName = interaction.data?.name;

  switch (commandName) {
    case 'sync':
      return await handleSyncCommand(interaction, env);
    case 'link':
      return await handleLinkCommand(interaction, env);
    case 'comment':
      return await handleCommentCommand(interaction, env, ctx);
    case 'issue':
      return await handleIssueCommand(interaction, env);
    default:
      return jsonResponse({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Unknown command: ${commandName}`,
          flags: 64, // Ephemeral
        },
      });
  }
}

// /sync 명령어: 현재 포스트의 GitHub 이슈 정보 확인
async function handleSyncCommand(
  interaction: DiscordInteraction,
  env: Env
): Promise<Response> {
  const channelId = interaction.channel_id;
  if (!channelId) {
    return ephemeralResponse('Could not determine channel.');
  }

  const mapping = await getIssueFromPost(env.MAPPING, channelId);
  if (!mapping) {
    return ephemeralResponse('This post is not linked to any GitHub issue.');
  }

  const { owner, repo, issueNumber } = mapping;
  const issueUrl = `https://github.com/${owner}/${repo}/issues/${issueNumber}`;

  return ephemeralResponse(
    `This post is linked to GitHub issue: [#${issueNumber}](${issueUrl})`
  );
}

// /link 명령어: 수동으로 이슈와 포스트 연결
async function handleLinkCommand(
  interaction: DiscordInteraction,
  env: Env
): Promise<Response> {
  // 이 기능은 나중에 구현 가능
  return ephemeralResponse(
    'Manual linking is not yet implemented. Issues are automatically linked when created from GitHub.'
  );
}

// /comment 명령어: Discord에서 GitHub 이슈로 코멘트 전송 (지연 응답 사용)
async function handleCommentCommand(
  interaction: DiscordInteraction,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const channelId = interaction.channel_id;
  if (!channelId) {
    return ephemeralResponse('Could not determine channel.');
  }

  // 이 포스트가 GitHub 이슈와 연결되어 있는지 확인
  const mapping = await getIssueFromPost(env.MAPPING, channelId);
  if (!mapping) {
    return ephemeralResponse('This post is not linked to any GitHub issue. Only posts created from GitHub issues can sync comments.');
  }

  // 코멘트 내용 가져오기
  const commentText = interaction.data?.options?.find(opt => opt.name === 'message')?.value;
  if (!commentText) {
    return ephemeralResponse('Please provide a comment message.');
  }

  // 사용자 정보
  const user = interaction.member?.user || interaction.user;
  const username = user?.global_name || user?.username || 'Unknown';

  const { owner, repo, issueNumber } = mapping;

  // 백그라운드에서 GitHub API 호출 (지연 응답 후)
  const token = interaction.token;
  const appId = interaction.application_id;

  // 비동기로 GitHub에 코멘트 전송 및 follow-up 메시지 전송
  const backgroundTask = (async () => {
    const commentBody = `**${username}** commented on Discord:\n\n${commentText}`;

    const result = await addIssueComment(
      env.GITHUB_APP_ID,
      env.GITHUB_PRIVATE_KEY,
      owner,
      repo,
      issueNumber,
      commentBody
    );

    // Follow-up 메시지 전송
    const followUpUrl = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
    const content = result
      ? `💬 **${username}**: ${commentText}\n\n_→ Synced to [GitHub issue #${issueNumber}](https://github.com/${owner}/${repo}/issues/${issueNumber})_`
      : `❌ Failed to send comment to GitHub. Please try again.`;

    await fetch(followUpUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  })();

  // 백그라운드 작업 시작 (응답과 별개로 실행)
  ctx.waitUntil(backgroundTask);

  // 즉시 "생각 중" 응답 반환 (3초 제한 회피)
  return jsonResponse({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  });
}

// /issue create 명령어: Modal 폼을 띄워서 GitHub 이슈 생성
async function handleIssueCommand(
  interaction: DiscordInteraction,
  env: Env
): Promise<Response> {
  const subcommand = interaction.data?.options?.[0]?.name;

  if (subcommand !== 'create') {
    return ephemeralResponse(`Unknown subcommand: ${subcommand}`);
  }

  // Modal 폼 띄우기
  return jsonResponse({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: 'issue_create_modal',
      title: 'GitHub 이슈 생성',
      components: [
        {
          type: 1, // Action Row
          components: [
            {
              type: 4, // Text Input
              custom_id: 'issue_title',
              label: '제목',
              style: 1, // Short
              placeholder: '이슈 제목을 입력하세요',
              required: true,
              max_length: 256,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'issue_body',
              label: '내용',
              style: 2, // Paragraph
              placeholder: '이슈 내용을 입력하세요 (선택사항)',
              required: false,
              max_length: 4000,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: 'issue_labels',
              label: '태그 (쉼표로 구분)',
              style: 1, // Short
              placeholder: 'bug, enhancement, documentation',
              required: false,
              max_length: 200,
            },
          ],
        },
      ],
    },
  });
}

// Modal 제출 처리
async function handleModalSubmit(
  interaction: DiscordInteraction,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const customId = interaction.data?.custom_id;

  if (customId !== 'issue_create_modal') {
    return ephemeralResponse('Unknown modal.');
  }

  // Modal에서 입력값 추출
  const components = interaction.data?.components || [];
  let title = '';
  let body = '';
  let labelsRaw = '';

  for (const row of components) {
    for (const comp of row.components) {
      if (comp.custom_id === 'issue_title') title = comp.value;
      if (comp.custom_id === 'issue_body') body = comp.value;
      if (comp.custom_id === 'issue_labels') labelsRaw = comp.value;
    }
  }

  const labels = labelsRaw
    ? labelsRaw.split(',').map(l => l.trim()).filter(Boolean)
    : [];

  if (!title) {
    return ephemeralResponse('제목을 입력해주세요.');
  }

  const user = interaction.member?.user || interaction.user;
  const username = user?.global_name || user?.username || 'Unknown';

  const owner = (env as any).GITHUB_OWNER || 'alphago2580';
  const repo = (env as any).GITHUB_REPO || 'MESA';

  const token = interaction.token;
  const appId = interaction.application_id;

  const backgroundTask = (async () => {
    const issueBody = body
      ? `${body}\n\n---\n_Created from Discord by **${username}**_`
      : `_Created from Discord by **${username}**_`;

    const result = await createIssue(
      env.GITHUB_APP_ID,
      env.GITHUB_PRIVATE_KEY,
      owner,
      repo,
      title,
      issueBody,
      labels
    );

    const followUpUrl = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
    const content = result
      ? `✅ GitHub 이슈 생성 완료!\n**#${result.number}** ${title}\n${result.html_url}`
      : `❌ 이슈 생성에 실패했습니다. 다시 시도해주세요.`;

    await fetch(followUpUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  })();

  ctx.waitUntil(backgroundTask);

  return jsonResponse({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  });
}

// 포럼 포스트 메시지 이벤트 처리 (Gateway 이벤트 - 별도 구현 필요)
export async function handleForumMessage(
  postId: string,
  authorName: string,
  content: string,
  env: Env
): Promise<void> {
  // Discord Gateway를 통해 받은 메시지 이벤트 처리
  // 포럼 포스트에 새 메시지가 오면 GitHub 이슈에 코멘트 추가

  const mapping = await getIssueFromPost(env.MAPPING, postId);
  if (!mapping) {
    console.log('No mapping found for post:', postId);
    return;
  }

  const { owner, repo, issueNumber } = mapping;

  // GitHub에 코멘트 추가
  const commentBody = `**${authorName}** commented on Discord:\n\n${content}`;

  await addIssueComment(
    env.GITHUB_APP_ID,
    env.GITHUB_PRIVATE_KEY,
    owner,
    repo,
    issueNumber,
    commentBody
  );
}

function jsonResponse(data: object): Response {
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}

function ephemeralResponse(content: string): Response {
  return jsonResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content,
      flags: 64, // Ephemeral - only visible to the user
    },
  });
}
