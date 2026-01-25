# Discord-GitHub Issue Worker

디스코드와 깃허브 이슈를 연동하는 워커입니다.

## 기능

- GitHub 이슈 생성/업데이트 시 Discord 알림
- Discord 명령어로 GitHub 이슈 생성
- 이슈 상태 변경 추적

## 설정

`config.json` 파일을 생성하고 다음 내용을 입력하세요:

```json
{
  "discord_token": "YOUR_DISCORD_BOT_TOKEN",
  "discord_channel_id": "YOUR_CHANNEL_ID",
  "github_token": "YOUR_GITHUB_TOKEN",
  "github_repo": "owner/repo"
}
```

## 실행

```bash
pip install -r requirements.txt
python main.py
```
