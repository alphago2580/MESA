
## 기술 스택

| 구분          | 선택                                       | 용도              | 비고                                                                                                                       |
| ----------- | ---------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **프론트엔드**   | Next.js + TypeScript + Tailwind CSS      | React 기반, UI 구현 | 웹 전용                                                                                                                     |
| **백엔드**     | Python (FastAPI) 또는 Next.js API Routes   | 둘 다 Vercel 가능   | LLM 라이브러리와 경제 데이터 분석용 라이브러리(pandas, numpy)도 바로 쓸 수 있음<br>요즘은 TypeScript도 Vercel AI SDK, LangChain.js 잘 되어 있어서 큰 차이 없다고 함 |
| **멀티 에이전트** | LangGraph (Python) 또는 Vercel AI SDK (TS) | 토론 로직 구현        | =                                                                                                                        |
| **시각화**     | Recharts 또는 Chart.js                     | 레포트용 차트         |                                                                                                                          |
| **배포**      | Vercel                                   | 프론트 + 백엔드 전부    | 300초                                                                                                                     |

---

## 두 가지 선택지

**A. TypeScript 통일**

```
Next.js (프론트 + API Routes) → Vercel
```

**B. Python 백엔드 분리**

```
Next.js (프론트) ↔ Vercel ↔ FastAPI (백엔드)
```

---

입력방식: 자연어 or UI 슬라이더 선택

---
## 프로토타입 

- 프롬프트:
넌 1500만불을 받는 프로 웹 디자이너야.
한 이메일을 받았어.
```
	저희 서비스가 성공할 수 있도록 웹디자인을 해주시길 부탁드려요.
	서비스의 내용은 다음과 같아요.
	# 거시경제 시뮬레이터
	1. 현재 지표와 상황을 가져옴
	2. 사용자가 바뀔 지표를 설정함 
	3. 각자 경제 주축이 되는 역할을 맡은 llm(소비자, 기업인, 정부, 중앙은행, 은행 등)이 각자 생각함
	4. 각자가 토론하고 합의점을 도출함 
	5. 각자 생각, 토론과 합의점을 레포트 형식으로 사용자에게 제공함
	입력방식: 자연어 or UI 슬라이더 선택, 슬라이더에 현재 상황에 + - 표시가 있었으면 좋겠음
	
	이걸 세련되고 우아한 웹 디자인을 적용해서, 진짜 프로페셔널한 웹 디자이너가 디자인한 프로토타입을 보여주세요. 팁은 아낌없이 드릴테니, 우리 서비스가 다른 애플이나 대기업들 웹사이트에 뒤처지지 않을정도로 세련된 웹 스타일을 보여주세요.
	감사합니다.
```
네 디자인 실력을 마음껏 발휘해봐.

---

## GEMINI 3 FLASH

<img width="1864" height="1192" alt="Image" src="https://github.com/user-attachments/assets/c6105f28-0f28-49fd-85ac-aa0feffac55f" />

<img width="1854" height="1186" alt="Image" src="https://github.com/user-attachments/assets/ec351688-2185-4cbe-9ba5-b915bb894676" />

<img width="1860" height="1184" alt="Image" src="https://github.com/user-attachments/assets/781c4e85-5000-458f-9ca3-20e73e001780" />

---
## OPUS 4.5


<img width="1751" height="1320" alt="Image" src="https://github.com/user-attachments/assets/2b119375-688f-498d-bae4-9c2ceaec90f2" />

<img width="1704" height="1194" alt="Image" src="https://github.com/user-attachments/assets/34fe4ddf-aa47-4c2c-bc57-dee47d034235" />

<img width="1676" height="758" alt="Image" src="https://github.com/user-attachments/assets/ac6884c1-87ad-45be-b68b-4e63cc0277e7" />

<img width="1914" height="840" alt="Image" src="https://github.com/user-attachments/assets/3a6a95c4-5113-49a3-889a-5d9e7f5100b4" />

<img width="1889" height="939" alt="Image" src="https://github.com/user-attachments/assets/3178605a-9a4a-4b27-ac33-4cd74ab7de9e" />