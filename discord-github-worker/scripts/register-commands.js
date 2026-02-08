// Discord 슬래시 커맨드 등록 스크립트
// 사용법: DISCORD_APP_ID=xxx DISCORD_BOT_TOKEN=xxx node scripts/register-commands.js

const DISCORD_API_BASE = 'https://discord.com/api/v10';

const commands = [
  {
    name: 'sync',
    description: '현재 포스트에 연결된 GitHub 이슈 정보를 확인합니다.',
    type: 1, // CHAT_INPUT
  },
  {
    name: 'comment',
    description: 'Discord에서 연결된 GitHub 이슈로 댓글을 전송합니다.',
    type: 1,
    options: [
      {
        name: 'message',
        description: 'GitHub 이슈에 전송할 댓글 내용',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'link',
    description: '현재 포스트를 GitHub 이슈에 수동으로 연결합니다. (준비 중)',
    type: 1,
  },
  {
    name: 'issue',
    description: 'GitHub 이슈를 관리합니다.',
    type: 1,
    options: [
      {
        name: 'create',
        description: '새 GitHub 이슈를 생성합니다.',
        type: 1, // SUB_COMMAND
      },
    ],
  },
];

async function registerCommands() {
  const appId = process.env.DISCORD_APP_ID;
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!appId || !token) {
    console.error('환경변수를 설정해주세요:');
    console.error('  DISCORD_APP_ID=xxx DISCORD_BOT_TOKEN=xxx node scripts/register-commands.js');
    process.exit(1);
  }

  const url = `${DISCORD_API_BASE}/applications/${appId}/commands`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`등록 실패 (${response.status}):`, error);
    process.exit(1);
  }

  const result = await response.json();
  console.log(`✓ ${result.length}개 슬래시 커맨드 등록 완료:`);
  result.forEach((cmd) => {
    console.log(`  /${cmd.name} - ${cmd.description}`);
  });
}

registerCommands();
