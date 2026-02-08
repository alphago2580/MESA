// GitHub Webhook 핸들러

import type { Env } from './index';
import { verifyGitHubSignature } from './utils/github-api';
import {
  createForumPost,
  sendMessageToThread,
  sendPRNotification,
} from './utils/discord-api';
import { getDiscordPostId, createMapping, getNotionPageId, createNotionMapping } from './utils/mapping';
import { createNotionPage, updateNotionPageStatus } from './utils/notion-api';

interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  body?: string;
  html_url: string;
  user: GitHubUser;
  labels?: Array<{ name: string; color: string }>;
  created_at?: string;
}

interface GitHubComment {
  id: number;
  body: string;
  html_url: string;
  user: GitHubUser;
}

interface GitHubPR {
  number: number;
  title: string;
  body?: string;
  html_url: string;
  user: GitHubUser;
  merged?: boolean;
  draft?: boolean;
}

interface GitHubRepository {
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
}

interface GitHubWebhookPayload {
  action?: string;
  issue?: GitHubIssue;
  comment?: GitHubComment;
  pull_request?: GitHubPR;
  repository: GitHubRepository;
  sender: GitHubUser;
}

export async function handleGitHubWebhook(
  request: Request,
  env: Env
): Promise<Response> {
  // 서명 검증
  const signature = request.headers.get('x-hub-signature-256');
  const event = request.headers.get('x-github-event');
  const body = await request.text();

  if (!signature) {
    return new Response('Missing signature', { status: 401 });
  }

  const isValid = await verifyGitHubSignature(
    env.GITHUB_WEBHOOK_SECRET,
    signature,
    body
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  const payload: GitHubWebhookPayload = JSON.parse(body);

  console.log(`Received GitHub event: ${event}, action: ${payload.action}`);

  switch (event) {
    case 'issues':
      return await handleIssueEvent(payload, env);
    case 'issue_comment':
      return await handleIssueCommentEvent(payload, env);
    case 'pull_request':
      return await handlePREvent(payload, env);
    default:
      return new Response(`Unhandled event: ${event}`, { status: 200 });
  }
}

async function handleIssueEvent(
  payload: GitHubWebhookPayload,
  env: Env
): Promise<Response> {
  const { action, issue, repository } = payload;
  if (!issue) return new Response('No issue in payload', { status: 400 });

  const owner = repository.owner.login;
  const repo = repository.name;

  if (action === 'opened') {
    // 새 이슈 → Discord 포럼 포스트 생성
    const forumChannelId = env.DISCORD_FORUM_CHANNEL_ID;
    if (!forumChannelId) {
      console.error('DISCORD_FORUM_CHANNEL_ID not configured');
      return new Response('Forum channel not configured', { status: 500 });
    }

    const title = `[#${issue.number}] ${issue.title}`;
    const content = formatIssueContent(issue, repository);

    const post = await createForumPost(
      env.DISCORD_BOT_TOKEN,
      forumChannelId,
      title,
      content
    );

    if (post) {
      // 매핑 저장
      await createMapping(env.MAPPING, owner, repo, issue.number, post.id);
      console.log(`Created Discord post ${post.id} for issue #${issue.number}`);
    }

    // 새 이슈 → Notion 데이터베이스에 추가
    const notionApiKey = env.NOTION_API_TOKEN || env.NOTION_API_KEY;
    const notionDbId = env.NOTION_DATA_SOURCE_ID || env.NOTION_DATABASE_ID;
    if (notionApiKey && notionDbId) {
      const notionPage = await createNotionPage(
        notionApiKey,
        notionDbId,
        {
          title: `[#${issue.number}] ${issue.title}`,
          issueNumber: issue.number,
          githubUrl: issue.html_url,
          state: 'open',
          author: issue.user.login,
          createdAt: issue.created_at ? issue.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        }
      );

      if (notionPage) {
        await createNotionMapping(env.MAPPING, owner, repo, issue.number, notionPage.id);
        console.log(`Created Notion page ${notionPage.id} for issue #${issue.number}`);
      }
    } else {
      console.log('Notion integration not configured, skipping');
    }

    return new Response('Issue created and synced', { status: 200 });
  }

  if (action === 'closed' || action === 'reopened') {
    // 이슈 상태 변경 → Discord에 알림
    const postId = await getDiscordPostId(env.MAPPING, owner, repo, issue.number);
    if (postId) {
      const status = action === 'closed' ? 'closed' : 're-opened';
      await sendMessageToThread(
        env.DISCORD_BOT_TOKEN,
        postId,
        `Issue #${issue.number} was ${status} by **${payload.sender.login}**`
      );
    }

    // 이슈 상태 변경 → Notion 상태 업데이트
    const notionKey = env.NOTION_API_TOKEN || env.NOTION_API_KEY;
    if (notionKey) {
      const notionPageId = await getNotionPageId(env.MAPPING, owner, repo, issue.number);
      if (notionPageId) {
        const newState = action === 'closed' ? 'closed' : 'open';
        await updateNotionPageStatus(notionKey, notionPageId, newState);
        console.log(`Updated Notion page ${notionPageId} status to ${newState}`);
      }
    }

    return new Response(`Issue ${action} notification sent`, { status: 200 });
  }

  return new Response(`Unhandled issue action: ${action}`, { status: 200 });
}

async function handleIssueCommentEvent(
  payload: GitHubWebhookPayload,
  env: Env
): Promise<Response> {
  const { action, issue, comment, repository } = payload;
  if (!issue || !comment) {
    return new Response('Missing issue or comment', { status: 400 });
  }

  // 새 코멘트만 처리 (편집/삭제는 무시)
  if (action !== 'created') {
    return new Response(`Ignoring comment action: ${action}`, { status: 200 });
  }

  // Discord에서 온 코멘트는 무시 (무한 루프 방지)
  if (comment.body.includes('commented on Discord:')) {
    return new Response('Ignoring comment from Discord sync', { status: 200 });
  }

  const owner = repository.owner.login;
  const repo = repository.name;

  const postId = await getDiscordPostId(env.MAPPING, owner, repo, issue.number);
  if (!postId) {
    console.log(`No Discord post found for issue #${issue.number}`);
    return new Response('No mapping found', { status: 200 });
  }

  // GitHub 코멘트 → Discord 포스트 댓글
  const content = formatCommentContent(comment);
  await sendMessageToThread(env.DISCORD_BOT_TOKEN, postId, content);

  console.log(`Synced comment to Discord post ${postId}`);
  return new Response('Comment synced', { status: 200 });
}

async function handlePREvent(
  payload: GitHubWebhookPayload,
  env: Env
): Promise<Response> {
  const { action, pull_request } = payload;
  if (!pull_request) {
    return new Response('No PR in payload', { status: 400 });
  }

  const prChannelId = env.DISCORD_PR_CHANNEL_ID;
  if (!prChannelId) {
    console.error('DISCORD_PR_CHANNEL_ID not configured');
    return new Response('PR channel not configured', { status: 500 });
  }

  // 주요 PR 이벤트만 알림
  const notifyActions = ['opened', 'closed', 'reopened', 'ready_for_review'];
  if (!notifyActions.includes(action || '')) {
    return new Response(`Ignoring PR action: ${action}`, { status: 200 });
  }

  // Draft PR은 무시
  if (pull_request.draft && action === 'opened') {
    return new Response('Ignoring draft PR', { status: 200 });
  }

  await sendPRNotification(env.DISCORD_BOT_TOKEN, prChannelId, {
    title: pull_request.title,
    number: pull_request.number,
    html_url: pull_request.html_url,
    user: pull_request.user,
    body: pull_request.body,
    action: action || 'unknown',
    merged: pull_request.merged,
  });

  console.log(`PR #${pull_request.number} notification sent`);
  return new Response('PR notification sent', { status: 200 });
}

function formatIssueContent(issue: GitHubIssue, repo: GitHubRepository): string {
  const parts = [
    `**New issue opened by [@${issue.user.login}](${issue.user.html_url})**`,
    '',
    issue.body?.slice(0, 1500) || '*No description provided*',
    '',
    `[View on GitHub](${issue.html_url})`,
  ];
  return parts.join('\n');
}

function formatCommentContent(comment: GitHubComment): string {
  const parts = [
    `**[@${comment.user.login}](${comment.user.html_url})** commented:`,
    '',
    comment.body.slice(0, 1800),
    '',
    `[View on GitHub](${comment.html_url})`,
  ];
  return parts.join('\n');
}
