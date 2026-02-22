"""
Example script for running backtests on historical data.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.exchange import ExchangeConnector
from src.backtesting import Backtester
from src.strategies.sma_strategy import SimpleMovingAverage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def load_config(config_path: str = 'config.json') -> dict:
    """Load configuration from JSON file."""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"Config file not found: {config_path}, using defaults")
        return {
            'exchange': {'name': 'binance', 'enableRateLimit': True},
            'trading': {'symbol': 'BTC/USDT', 'timeframe': '1h'},
            'backtesting': {'initial_balance': 10000}
        }


async def run_backtest():
    """Run backtest on historical data."""
    logger.info("="*60)
    logger.info("MESA - Backtesting Example")
    logger.info("="*60)
    
    # Load configuration
    config = load_config()
    
    # Initialize exchange connector to fetch historical data
    exchange = ExchangeConnector(config['exchange'])
    
    try:
        # Connect to exchange
        await exchange.connect()
        
        # Fetch historical data
        symbol = config['trading']['symbol']
        timeframe = config['trading']['timeframe']
        logger.info(f"Fetching historical data for {symbol} ({timeframe})...")
        
        # Fetch more data for better backtesting (500 candles)
        ohlcv_data = await exchange.fetch_ohlcv(symbol, timeframe, limit=500)
        logger.info(f"Fetched {len(ohlcv_data)} candles")
        
        # Initialize strategy
        strategy = SimpleMovingAverage(short_window=10, long_window=30)
        logger.info(f"Strategy: {strategy.name}")
        
        # Initialize backtester
        initial_balance = config['backtesting']['initial_balance']
        backtester = Backtester(initial_balance=initial_balance)
        
        # Run backtest
        logger.info("Running backtest...")
        results = await backtester.run(strategy, ohlcv_data, trade_amount=0.5)
        
        # Save results
        with open('backtest_results.json', 'w') as f:
            # Remove trades list for cleaner output
            summary = {k: v for k, v in results.items() if k != 'trades'}
            json.dump(summary, f, indent=2)
        
        logger.info("Results saved to backtest_results.json")
        
    except Exception as e:
        logger.error(f"Error during backtest: {e}")
        raise
    finally:
        await exchange.disconnect()


if __name__ == "__main__":
    asyncio.run(run_backtest())
