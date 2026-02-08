# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Discord-GitHub-Notion 통합 Worker: Cloudflare Workers에서 실행되는 TypeScript 기반 서버리스 애플리케이션으로, GitHub 이슈와 Discord 포럼 포스트, Notion 데이터베이스를 양방향으로 동기화합니다.

## Development Commands

```bash
# 디렉토리 이동
cd discord-github-worker

# 로컬 개발 서버 실행
npm run dev

# Cloudflare Workers에 배포
npm run deploy

# 실시간 로그 확인
npm run tail
```

## Configuration Management

### Secrets 설정 (민감 정보)
```bash
wrangler secret put DISCORD_PUBLIC_KEY
wrangler secret put DISCORD_BOT_TOKEN
wrangler secret put GITHUB_PRIVATE_KEY
wrangler secret put GITHUB_WEBHOOK_SECRET
wrangler secret put NOTION_API_KEY  # 선택사항
```

### KV Namespace 설정
```bash
# 최초 1회만 실행
wrangler kv namespace create MAPPING

# 출력된 ID를 wrangler.toml의 kv_namespaces.id에 입력
```

### Environment Variables
`wrangler.toml`의 `[vars]` 섹션에서 설정:
- `GITHUB_APP_ID`: GitHub App ID
- `DISCORD_FORUM_CHANNEL_ID`: 이슈 동기화용 Discord 포럼 채널 ID
- `DISCORD_PR_CHANNEL_ID`: PR 알림용 Discord 채널 ID
- `NOTION_DATABASE_ID`: Notion 데이터베이스 ID (선택사항)

## Architecture

### Request Flow

```
┌─────────────┐     /discord      ┌──────────────────┐
│   Discord   │ ──────────────────▶│                  │
│ Interaction │                    │                  │
└─────────────┘                    │  Cloudflare      │
                                   │  Worker          │
┌─────────────┐     /github       │  (index.ts)      │
│   GitHub    │ ──────────────────▶│                  │
│  Webhook    │                    │                  │
└─────────────┘                    └──────────────────┘
                                          │
                                          ▼
                                   ┌──────────────────┐
                                   │  KV Namespace    │
                                   │  (MAPPING)       │
                                   └──────────────────┘
```

### Core Components

**src/index.ts**: 메인 엔트리포인트
- `/discord`: Discord Interaction 엔드포인트 (서명 검증 + 커맨드 라우팅)
- `/github`: GitHub Webhook 엔드포인트 (서명 검증 + 이벤트 라우팅)
- `/health`: 헬스체크

**src/discord.ts**: Discord 이벤트 핸들러
- `/sync`: 현재 포스트의 연결된 GitHub 이슈 확인
- `/comment`: Discord에서 GitHub 이슈로 댓글 전송 (deferred response로 3초 제한 회피)
- `handleForumMessage()`: Gateway 이벤트 처리 (구현 예정)

**src/github.ts**: GitHub Webhook 핸들러
- `issues.opened`: Discord 포럼 포스트 + Notion 페이지 생성
- `issues.closed/reopened`: Discord 알림 + Notion 상태 업데이트
- `issue_comment.created`: GitHub 댓글 → Discord 포스트 (무한 루프 방지 로직 포함)
- `pull_request.*`: PR 알림 전송 (opened/closed/reopened/ready_for_review만 처리, draft 제외)

**src/utils/mapping.ts**: KV 기반 양방향 매핑
- `issue:{owner}/{repo}/{issueNumber}` → Discord 포스트 ID
- `post:{postId}` → `{owner}/{repo}/{issueNumber}`
- `notion:{owner}/{repo}/{issueNumber}` → Notion 페이지 ID

**src/utils/discord-api.ts**: Discord API 클라이언트
- `createForumPost()`: 포럼 채널에 새 포스트(스레드) 생성
- `sendMessageToThread()`: 포스트에 댓글 추가
- `sendPRNotification()`: Embed를 사용한 PR 알림
- `verifyDiscordSignature()`: Ed25519 서명 검증

**src/utils/github-api.ts**: GitHub API 클라이언트 (GitHub App 인증)
- `createJWT()`: RS256 JWT 생성 (PKCS#1 → PKCS#8 자동 변환)
- `getInstallationToken()`: Repository별 Installation Access Token 획득
- `addIssueComment()`: 이슈에 댓글 추가
- `verifyGitHubSignature()`: HMAC-SHA256 서명 검증

**src/utils/notion-api.ts**: Notion API 클라이언트
- `createNotionPage()`: 데이터베이스에 이슈 페이지 생성
- `updateNotionPageStatus()`: 이슈 상태(Open/Closed) 업데이트
- Notion 속성: 제목, 이슈번호, GitHub 링크, 상태, 작성자, 생성일

### Key Design Patterns

**무한 루프 방지**
- Discord → GitHub 댓글: `**{username}** commented on Discord:` 접두사 추가
- GitHub → Discord 댓글: 댓글 본문에 "commented on Discord:" 포함 시 무시

**서명 검증**
- Discord: Ed25519 (`x-signature-ed25519`, `x-signature-timestamp`)
- GitHub: HMAC-SHA256 (`x-hub-signature-256`)

**비동기 작업 처리**
- `/comment` 명령: `InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE` 즉시 반환 후 `ctx.waitUntil()`로 백그라운드 작업 실행
- 3초 Discord Interaction 제한 회피

**GitHub App 인증**
- PEM 포맷 private key를 PKCS#8로 변환하여 Web Crypto API 호환
- Base64 인코딩된 PEM도 자동 디코딩 처리
- Repository별로 동적 Installation Token 획득 (캐싱 없음)

## Important Notes

- Discord 메시지/타이틀 길이 제한: 2000자 (초과 시 자동 truncate)
- GitHub private key는 base64 인코딩 또는 PEM 형식 모두 지원
- Notion 통합은 선택사항 (`NOTION_API_KEY`와 `NOTION_DATABASE_ID` 미설정 시 스킵)
- PR draft는 `opened` 이벤트에서 자동 무시됨
