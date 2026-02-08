# Discord-GitHub-Notion Integration Worker

Cloudflare Workers 기반 서버리스 애플리케이션.
GitHub 이슈, Discord 포럼 포스트, Notion 데이터베이스를 양방향으로 동기화한다.

## Architecture

```
┌─────────────┐     POST /discord     ┌──────────────────┐     GitHub API
│   Discord   │ ─────────────────────▶│                  │────────────────▶ Issues, Comments
│ Interaction │                       │                  │
└─────────────┘                       │   Cloudflare     │     Notion API
                                      │    Worker        │────────────────▶ Database Pages
┌─────────────┐     POST /github      │                  │
│   GitHub    │ ─────────────────────▶│                  │     Discord API
│  Webhook    │                       │                  │────────────────▶ Forum Posts, Embeds
└─────────────┘                       └────────┬─────────┘
                                               │
                                        KV Namespace
                                      (양방향 매핑 저장)
                                      issue ↔ post ↔ notion
```

## Features

### GitHub → Discord
| 이벤트 | 동작 |
|--------|------|
| 이슈 생성 | 포럼 채널에 새 포스트 생성 |
| 이슈 댓글 | 연결된 포스트에 메시지 전송 |
| 이슈 close/reopen | 포스트에 상태 변경 알림 |
| PR opened/closed/merged | PR 채널에 Embed 알림 |

### GitHub → Notion
| 이벤트 | 동작 |
|--------|------|
| 이슈 생성 | 데이터베이스에 페이지 추가 |
| 이슈 close/reopen | 페이지 상태 업데이트 |

### Discord → GitHub
| 커맨드 | 동작 |
|--------|------|
| `/issue create` | Modal 폼으로 GitHub 이슈 생성 (라벨 지원) |
| `/comment <message>` | 연결된 GitHub 이슈에 댓글 전송 |
| `/sync` | 현재 포스트의 연결된 이슈 정보 확인 |

## Tech Stack

- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Storage**: Cloudflare KV (양방향 매핑)
- **Auth**: GitHub App (JWT + Installation Token), Discord Ed25519 서명 검증

## Project Structure

```
discord-github-worker/
├── src/
│   ├── index.ts              # 라우터 (엔트리포인트)
│   ├── discord.ts            # Discord Interaction 핸들러
│   ├── github.ts             # GitHub Webhook 핸들러
│   └── utils/
│       ├── discord-api.ts    # Discord API 호출
│       ├── github-api.ts     # GitHub App 인증 + API 호출
│       ├── notion-api.ts     # Notion API 호출
│       └── mapping.ts        # KV 매핑 관리
├── scripts/
│   └── register-commands.js  # 슬래시 커맨드 등록
├── wrangler.toml             # Cloudflare Workers 설정
└── docs/
    └── README.md             # 이 문서
```

## KV Mapping Schema

```
issue:{owner}/{repo}/{number}  →  Discord Post ID
post:{postId}                  →  {owner}/{repo}/{number}
notion:{owner}/{repo}/{number} →  Notion Page ID
```

## Setup

### 1. KV Namespace 생성
```bash
wrangler kv namespace create MAPPING
# 출력된 ID를 wrangler.toml에 입력
```

### 2. Secrets 설정
```bash
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_BOT_TOKEN
wrangler secret put GITHUB_PRIVATE_KEY
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler secret put NOTION_API_TOKEN       # 선택
wrangler secret put NOTION_DATA_SOURCE_ID  # 선택
```

### 3. 슬래시 커맨드 등록
```bash
DISCORD_APP_ID=xxx DISCORD_BOT_TOKEN=xxx node scripts/register-commands.js
```

### 4. 배포
```bash
npm run deploy
```

### 5. Webhook 연결
- **Discord**: Bot Settings → Interactions Endpoint URL → `https://<worker>.workers.dev/discord`
- **GitHub**: Repo Settings → Webhooks → `https://<worker>.workers.dev/github`
  - Events: Issues, Issue comments, Pull requests

## Loop Prevention

Discord→GitHub 댓글에 `commented on Discord:` 마커를 포함시키고,
GitHub→Discord 동기화 시 해당 마커가 있는 댓글은 무시하여 무한 루프를 방지한다.
