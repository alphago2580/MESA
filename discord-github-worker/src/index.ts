// Discord-GitHub 연동 Worker 메인 엔트리포인트

import { handleDiscordRequest } from './discord';
import { handleGitHubWebhook } from './github';

export interface Env {
  MAPPING: KVNamespace;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_WEBHOOK_SECRET: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  DISCORD_FORUM_CHANNEL_ID?: string;
  DISCORD_PR_CHANNEL_ID?: string;
  NOTION_API_KEY?: string;
  NOTION_API_TOKEN?: string;
  NOTION_DATABASE_ID?: string;
  NOTION_DATA_SOURCE_ID?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256, X-GitHub-Event, X-Signature-Ed25519, X-Signature-Timestamp',
        },
      });
    }

    // 라우팅
    try {
      switch (url.pathname) {
        case '/discord':
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
          }
          return await handleDiscordRequest(request, env, ctx);

        case '/github':
          if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
          }
          return await handleGitHubWebhook(request, env);

        case '/health':
          return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
            headers: { 'Content-Type': 'application/json' },
          });

        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: String(error) }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
