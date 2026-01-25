# MESA - Crypto Trading Bot(견본코드라 다바꿔야합니다)

[한국어 문서](README_ko.md)

A Python-based cryptocurrency trading bot using **ccxt** library with **asyncio** for fast execution. MESA provides a simple and extensible framework for implementing trading strategies and backtesting them on historical data.

## Features

- ⚡ **Fast Async Execution**: Built with asyncio for high-performance concurrent operations
- 🔌 **Multi-Exchange Support**: Uses ccxt library supporting 100+ cryptocurrency exchanges
- 📊 **Strategy Framework**: Simple base class for implementing custom trading strategies
- 📈 **Backtesting Engine**: Test strategies on historical data before live trading
- 🎯 **Example Strategy**: Includes Simple Moving Average (SMA) crossover strategy
- 🔧 **Configurable**: Easy JSON-based configuration for exchange and trading parameters

## Project Structure

```
MESA/
├── src/
│   ├── __init__.py           # Package initialization
│   ├── bot.py                # Main trading bot
│   ├── exchange.py           # Exchange connector using ccxt
│   ├── strategies/
│   │   ├── __init__.py       # Strategy base class
│   │   └── sma_strategy.py   # SMA crossover strategy
│   └── backtesting/
│       └── __init__.py       # Backtesting engine
├── tests/                    # Test files
├── main.py                   # Main entry point for live trading
├── example_backtest.py       # Example backtest script
├── config.example.json       # Example configuration file
├── requirements.txt          # Python dependencies
└── README.md                 # This file
```

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/alphago2580/MESA.git
cd MESA
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create configuration file:
```bash
cp config.example.json config.json
```

4. Edit `config.json` with your exchange API credentials and trading parameters:
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

## Usage

### Running Backtests

Test your strategy on historical data before live trading:

```bash
python example_backtest.py
```

This will:
1. Fetch historical OHLCV data from the exchange
2. Run the strategy on the data
3. Display performance metrics
4. Save results to `backtest_results.json`

### Live Trading

**⚠️ Warning**: Live trading involves real money. Start with small amounts and paper trading if available.

```bash
python main.py
```

The bot will:
1. Connect to the configured exchange
2. Monitor the market in real-time
3. Execute trades based on strategy signals
4. Log all activities to `trading_bot.log`

### Stop the Bot

Press `Ctrl+C` to gracefully stop the trading bot.

## Creating Custom Strategies

To create your own trading strategy:

1. Create a new file in `src/strategies/` (e.g., `my_strategy.py`)

2. Inherit from the `Strategy` base class:

```python
from typing import List
from . import Strategy

class MyStrategy(Strategy):
    def __init__(self):
        super().__init__(name="MyStrategy")
    
    async def analyze(self, ohlcv_data: List[List]) -> str:
        """
        Analyze market data and return trading signal.
        
        Args:
            ohlcv_data: OHLCV candlestick data
            
        Returns:
            'buy', 'sell', or 'hold'
        """
        # Your strategy logic here
        # Convert data to DataFrame using self.convert_to_dataframe()
        df = self.convert_to_dataframe(ohlcv_data)
        
        # Implement your analysis
        # Return 'buy', 'sell', or 'hold'
        return 'hold'
```

3. Use your strategy in `main.py`:

```python
from src.strategies.my_strategy import MyStrategy

strategy = MyStrategy()
bot = TradingBot(exchange_config, trading_config, strategy)
```

## Strategy Implementation Example

The included `SimpleMovingAverage` strategy demonstrates the strategy pattern:

- Calculates short-term and long-term moving averages
- Generates buy signal when short MA crosses above long MA (bullish crossover)
- Generates sell signal when short MA crosses below long MA (bearish crossover)
- Manages position state to avoid duplicate signals

## Backtesting

The backtesting engine provides:

- **Position Management**: Simulates opening and closing positions
- **Performance Metrics**: 
  - Total return and return percentage
  - Win rate
  - Average win/loss
  - Number of trades
- **Trade History**: Complete log of all simulated trades
- **Flexible Configuration**: Adjustable trade amounts and parameters

## API Documentation

### ExchangeConnector

Async wrapper for ccxt exchange operations:

- `connect()`: Establish exchange connection
- `fetch_ticker(symbol)`: Get current price
- `fetch_ohlcv(symbol, timeframe, limit)`: Get candlestick data
- `create_market_order(symbol, side, amount)`: Execute market order
- `fetch_balance()`: Get account balance

### Strategy Base Class

Abstract class for implementing strategies:

- `analyze(ohlcv_data)`: Main method to implement - returns 'buy', 'sell', or 'hold'
- `convert_to_dataframe(ohlcv_data)`: Convert raw data to pandas DataFrame
- `set_position(position, entry_price)`: Update position state
- `get_position()`: Get current position

### TradingBot

Main bot coordinating trading operations:

- `start()`: Start the trading bot
- `stop()`: Stop the trading bot
- `get_account_info()`: Get balance and position info

### Backtester

Test strategies on historical data:

- `run(strategy, ohlcv_data, trade_amount)`: Execute backtest
- Returns detailed performance metrics

## Configuration

### Exchange Configuration

- `name`: Exchange name (binance, coinbase, kraken, etc.)
- `api_key`: Your API key
- `secret`: Your API secret
- `enableRateLimit`: Enable rate limiting (recommended: true)

### Trading Configuration

- `symbol`: Trading pair (e.g., "BTC/USDT")
- `timeframe`: Candlestick timeframe ("1m", "5m", "1h", etc.)
- `amount`: Order size in base currency
- `strategy`: Strategy name (for reference)

### Backtesting Configuration

- `initial_balance`: Starting capital for backtesting

## Safety and Best Practices

1. **Start Small**: Test with minimal amounts initially
2. **Use Testnet**: Many exchanges offer testnet/sandbox for practice
3. **Monitor Logs**: Always check logs for errors or unexpected behavior
4. **Backtest First**: Thoroughly backtest strategies before live trading
5. **Set Limits**: Implement stop-loss and take-profit mechanisms
6. **Secure Credentials**: Never commit API keys to version control
7. **Understand Risks**: Cryptocurrency trading carries significant risk

## Requirements

- ccxt >= 4.0.0
- aiohttp >= 3.8.0
- pandas >= 2.0.0
- numpy >= 1.24.0
- python-dotenv >= 1.0.0

## License

MIT License - see [LICENSE](LICENSE) file for details

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Disclaimer

This software is for educational purposes only. Use at your own risk. The authors are not responsible for any financial losses incurred through the use of this trading bot. Cryptocurrency trading involves substantial risk of loss.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

## Author

sin seongsik

---

**Happy Trading! 📈🚀**
