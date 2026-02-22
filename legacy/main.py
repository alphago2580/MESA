"""
Main entry point for the MESA crypto trading bot.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.bot import TradingBot
from src.strategies.sma_strategy import SimpleMovingAverage

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trading_bot.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


def load_config(config_path: str = 'config.json') -> dict:
    """Load configuration from JSON file."""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"Config file not found: {config_path}")
        logger.info("Please copy config.example.json to config.json and update with your settings")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in config file: {e}")
        sys.exit(1)


async def main():
    """Main function to run the trading bot."""
    logger.info("="*60)
    logger.info("MESA - Crypto Trading Bot")
    logger.info("="*60)
    
    # Load configuration
    config = load_config()
    
    # Initialize strategy
    strategy = SimpleMovingAverage(short_window=10, long_window=30)
    logger.info(f"Initialized strategy: {strategy.name}")
    
    # Initialize trading bot
    bot = TradingBot(
        exchange_config=config['exchange'],
        trading_config=config['trading'],
        strategy=strategy
    )
    
    try:
        # Start the bot
        await bot.start()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
        await bot.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        await bot.stop()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
