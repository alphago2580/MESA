# MESA - 암호화폐 트레이딩 봇 (견본코드라 다바꿔야합니다)

[English Documentation](README.md)

**ccxt** 라이브러리와 **asyncio**를 사용하여 빠른 실행이 가능한 Python 기반 암호화폐 트레이딩 봇입니다. MESA는 트레이딩 전략을 구현하고 과거 데이터로 백테스팅할 수 있는 간단하고 확장 가능한 프레임워크를 제공합니다.

## 주요 기능

- ⚡ **빠른 비동기 실행**: 고성능 동시 작업을 위한 asyncio 기반
- 🔌 **다중 거래소 지원**: 100개 이상의 암호화폐 거래소를 지원하는 ccxt 라이브러리 사용
- 📊 **전략 프레임워크**: 사용자 정의 트레이딩 전략 구현을 위한 간단한 베이스 클래스
- 📈 **백테스팅 엔진**: 실제 거래 전 과거 데이터로 전략 테스트
- 🎯 **예제 전략**: 단순 이동평균(SMA) 크로스오버 전략 포함
- 🔧 **설정 가능**: 거래소 및 트레이딩 파라미터를 위한 간편한 JSON 기반 설정

## 프로젝트 구조

```
MESA/
├── src/
│   ├── __init__.py           # 패키지 초기화
│   ├── bot.py                # 메인 트레이딩 봇
│   ├── exchange.py           # ccxt를 사용한 거래소 커넥터
│   ├── strategies/
│   │   ├── __init__.py       # 전략 베이스 클래스
│   │   └── sma_strategy.py   # SMA 크로스오버 전략
│   └── backtesting/
│       └── __init__.py       # 백테스팅 엔진
├── tests/                    # 테스트 파일
├── main.py                   # 실시간 트레이딩 메인 진입점
├── example_backtest.py       # 백테스트 예제 스크립트
├── config.example.json       # 설정 파일 예제
├── requirements.txt          # Python 의존성
└── README.md                 # 영문 문서
```

## 설치

### 사전 요구사항

- Python 3.8 이상
- pip 패키지 매니저

### 설정

1. 저장소 클론:
```bash
git clone https://github.com/alphago2580/MESA.git
cd MESA
```

2. 의존성 설치:
```bash
pip install -r requirements.txt
```

3. 설정 파일 생성:
```bash
cp config.example.json config.json
```

4. 거래소 API 자격 증명 및 트레이딩 파라미터로 `config.json` 수정:
```json
{
  "exchange": {
    "name": "binance",
    "api_key": "YOUR_API_KEY",
    "secret": "YOUR_SECRET",
    "enableRateLimit": true
  },
  "trading": {
    "symbol": "BTC/USDT",
    "timeframe": "1m",
    "amount": 0.001,
    "strategy": "SimpleMovingAverage"
  },
  "backtesting": {
    "initial_balance": 10000
  }
}
```

## 사용법

### 백테스트 실행

실시간 거래 전에 과거 데이터로 전략을 테스트하세요:

```bash
python example_backtest.py
```

실행 내용:
1. 거래소에서 과거 OHLCV 데이터 가져오기
2. 데이터에 전략 실행
3. 성능 지표 표시
4. 결과를 `backtest_results.json`에 저장

### 실시간 트레이딩

**⚠️ 경고**: 실시간 트레이딩은 실제 자금을 사용합니다. 소액으로 시작하고 가능한 경우 페이퍼 트레이딩을 사용하세요.

```bash
python main.py
```

봇의 작동:
1. 설정된 거래소에 연결
2. 실시간으로 시장 모니터링
3. 전략 신호에 따라 거래 실행
4. 모든 활동을 `trading_bot.log`에 기록

### 봇 중지

`Ctrl+C`를 눌러 트레이딩 봇을 안전하게 중지합니다.

## 사용자 정의 전략 만들기

자신만의 트레이딩 전략을 만들려면:

1. `src/strategies/`에 새 파일 생성 (예: `my_strategy.py`)

2. `Strategy` 베이스 클래스 상속:

```python
from typing import List
from . import Strategy

class MyStrategy(Strategy):
    def __init__(self):
        super().__init__(name="MyStrategy")
    
    async def analyze(self, ohlcv_data: List[List]) -> str:
        """
        시장 데이터를 분석하고 트레이딩 신호를 반환합니다.
        
        Args:
            ohlcv_data: OHLCV 캔들스틱 데이터
            
        Returns:
            'buy', 'sell', 또는 'hold'
        """
        # 여기에 전략 로직 작성
        # self.convert_to_dataframe()을 사용하여 데이터를 DataFrame으로 변환
        df = self.convert_to_dataframe(ohlcv_data)
        
        # 분석 구현
        # 'buy', 'sell', 또는 'hold' 반환
        return 'hold'
```

3. `main.py`에서 전략 사용:

```python
from src.strategies.my_strategy import MyStrategy

strategy = MyStrategy()
bot = TradingBot(exchange_config, trading_config, strategy)
```

## 전략 구현 예제

포함된 `SimpleMovingAverage` 전략은 전략 패턴을 보여줍니다:

- 단기 및 장기 이동평균 계산
- 단기 MA가 장기 MA 위로 교차할 때 매수 신호 생성 (상승 크로스오버)
- 단기 MA가 장기 MA 아래로 교차할 때 매도 신호 생성 (하락 크로스오버)
- 중복 신호를 방지하기 위한 포지션 상태 관리

## 백테스팅

백테스팅 엔진이 제공하는 기능:

- **포지션 관리**: 포지션 열기 및 닫기 시뮬레이션
- **성능 지표**: 
  - 총 수익 및 수익률
  - 승률
  - 평균 수익/손실
  - 거래 횟수
- **거래 기록**: 모든 시뮬레이션 거래의 완전한 로그
- **유연한 설정**: 조정 가능한 거래 금액 및 파라미터

## API 문서

### ExchangeConnector

ccxt 거래소 작업을 위한 비동기 래퍼:

- `connect()`: 거래소 연결 설정
- `fetch_ticker(symbol)`: 현재 가격 가져오기
- `fetch_ohlcv(symbol, timeframe, limit)`: 캔들스틱 데이터 가져오기
- `create_market_order(symbol, side, amount)`: 시장가 주문 실행
- `fetch_balance()`: 계정 잔액 가져오기

### Strategy 베이스 클래스

전략 구현을 위한 추상 클래스:

- `analyze(ohlcv_data)`: 구현할 메인 메서드 - 'buy', 'sell', 또는 'hold' 반환
- `convert_to_dataframe(ohlcv_data)`: 원시 데이터를 pandas DataFrame으로 변환
- `set_position(position, entry_price)`: 포지션 상태 업데이트
- `get_position()`: 현재 포지션 가져오기

### TradingBot

트레이딩 작업을 조정하는 메인 봇:

- `start()`: 트레이딩 봇 시작
- `stop()`: 트레이딩 봇 중지
- `get_account_info()`: 잔액 및 포지션 정보 가져오기

### Backtester

과거 데이터로 전략 테스트:

- `run(strategy, ohlcv_data, trade_amount)`: 백테스트 실행
- 상세한 성능 지표 반환

## 설정

### 거래소 설정

- `name`: 거래소 이름 (binance, coinbase, kraken 등)
- `api_key`: API 키
- `secret`: API 시크릿
- `enableRateLimit`: 속도 제한 활성화 (권장: true)

### 트레이딩 설정

- `symbol`: 거래 쌍 (예: "BTC/USDT")
- `timeframe`: 캔들스틱 시간프레임 ("1m", "5m", "1h" 등)
- `amount`: 기본 통화 단위의 주문 크기
- `strategy`: 전략 이름 (참조용)

### 백테스팅 설정

- `initial_balance`: 백테스팅 시작 자본

## 안전 및 모범 사례

1. **소액으로 시작**: 처음에는 최소 금액으로 테스트
2. **테스트넷 사용**: 많은 거래소에서 연습용 테스트넷/샌드박스 제공
3. **로그 모니터링**: 항상 오류나 예상치 못한 동작을 확인
4. **백테스트 우선**: 실시간 거래 전 전략을 철저히 백테스트
5. **한도 설정**: 손절 및 이익실현 메커니즘 구현
6. **자격 증명 보안**: API 키를 버전 관리에 커밋하지 마세요
7. **위험 이해**: 암호화폐 거래는 상당한 위험을 수반합니다

## 요구사항

- ccxt >= 4.0.0
- aiohttp >= 3.8.0
- pandas >= 2.0.0
- numpy >= 1.24.0
- python-dotenv >= 1.0.0

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 기여

기여를 환영합니다! Pull Request를 자유롭게 제출해 주세요.

## 면책 조항

이 소프트웨어는 교육 목적으로만 제공됩니다. 사용에 따른 책임은 본인에게 있습니다. 저자는 이 트레이딩 봇 사용으로 인한 재정적 손실에 대해 책임지지 않습니다. 암호화폐 거래는 상당한 손실 위험을 수반합니다.

## 지원

문제, 질문 또는 제안 사항이 있으면 GitHub에 이슈를 열어주세요.

## 저자

sin seongsik

---

**즐거운 트레이딩 되세요! 📈🚀**
