// Discord API 호출 유틸리티

const DISCORD_API_BASE = 'https://discord.com/api/v10';

interface DiscordEnv {
  DISCORD_BOT_TOKEN: string;
}

async function discordFetch(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${DISCORD_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

// 포럼 채널에 새 포스트(스레드) 생성
export async function createForumPost(
  token: string,
  forumChannelId: string,
  title: string,
  content: string,
  appliedTags?: string[]
): Promise<{ id: string; message_id: string } | null> {
  const response = await discordFetch(
    `/channels/${forumChannelId}/threads`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        name: title.slice(0, 100), // Discord 제한: 100자
        message: {
          content: content.slice(0, 2000), // Discord 제한: 2000자
        },
        applied_tags: appliedTags,
      }),
    }
  );

  if (!response.ok) {
    console.error('Failed to create forum post:', await response.text());
    return null;
  }

  const data = await response.json() as { id: string; last_message_id: string };
  return { id: data.id, message_id: data.last_message_id };
}

// 스레드(포스트)에 메시지 전송
export async function sendMessageToThread(
  token: string,
  threadId: string,
  content: string
): Promise<{ id: string } | null> {
  const response = await discordFetch(
    `/channels/${threadId}/messages`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        content: content.slice(0, 2000),
      }),
    }
  );

  if (!response.ok) {
    console.error('Failed to send message:', await response.text());
    return null;
  }

  return await response.json() as { id: string };
}

// 일반 채널에 메시지 전송 (PR 알림용)
export async function sendMessageToChannel(
  token: string,
  channelId: string,
  content: string,
  embeds?: object[]
): Promise<{ id: string } | null> {
  const response = await discordFetch(
    `/channels/${channelId}/messages`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        content: content?.slice(0, 2000),
        embeds,
      }),
    }
  );

  if (!response.ok) {
    console.error('Failed to send channel message:', await response.text());
    return null;
  }

  return await response.json() as { id: string };
}

// Embed를 사용한 PR 알림 전송
export async function sendPRNotification(
  token: string,
  channelId: string,
  pr: {
    title: string;
    number: number;
    html_url: string;
    user: { login: string; avatar_url: string };
    body?: string;
    action: string;
    merged?: boolean;
  }
): Promise<{ id: string } | null> {
  const actionText = pr.merged ? 'merged' : pr.action;
  const colors: Record<string, number> = {
    opened: 0x238636,    // green
    closed: 0xda3633,    // red
    merged: 0x8957e5,    // purple
    reopened: 0x238636,  // green
  };

  const embed = {
    title: `PR #${pr.number}: ${pr.title}`,
    url: pr.html_url,
    description: pr.body?.slice(0, 300) || '',
    color: colors[actionText] || 0x586069,
    author: {
      name: pr.user.login,
      icon_url: pr.user.avatar_url,
    },
    footer: {
      text: `Pull Request ${actionText}`,
    },
    timestamp: new Date().toISOString(),
  };

  return await sendMessageToChannel(token, channelId, '', [embed]);
}

// Discord Interaction 서명 검증
export async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(timestamp + body);

    const signatureBytes = hexToUint8Array(signature);
    const publicKeyBytes = hexToUint8Array(publicKey);

    const key = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'Ed25519', namedCurve: 'Ed25519' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify(
      'Ed25519',
      key,
      signatureBytes,
      message
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
