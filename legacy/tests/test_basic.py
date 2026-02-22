"""
Basic tests for MESA trading bot components.
"""

import asyncio
import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.strategies.sma_strategy import SimpleMovingAverage
from src.backtesting import Backtester


class TestSMAStrategy(unittest.TestCase):
    """Test Simple Moving Average strategy."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.strategy = SimpleMovingAverage(short_window=5, long_window=10)
        
    def test_strategy_initialization(self):
        """Test strategy is initialized correctly."""
        self.assertEqual(self.strategy.name, "SimpleMovingAverage")
        self.assertEqual(self.strategy.short_window, 5)
        self.assertEqual(self.strategy.long_window, 10)
        self.assertIsNone(self.strategy.position)
        
    def test_position_management(self):
        """Test position setting and getting."""
        self.strategy.set_position('long', 50000.0)
        position = self.strategy.get_position()
        self.assertEqual(position['position'], 'long')
        self.assertEqual(position['entry_price'], 50000.0)
        
    def test_convert_to_dataframe(self):
        """Test OHLCV data conversion to DataFrame."""
        ohlcv_data = [
            [1640000000000, 100, 110, 90, 105, 1000],
            [1640000060000, 105, 115, 95, 110, 1100],
        ]
        df = self.strategy.convert_to_dataframe(ohlcv_data)
        self.assertEqual(len(df), 2)
        self.assertIn('close', df.columns)
        self.assertEqual(df.iloc[0]['close'], 105)


class TestBacktester(unittest.TestCase):
    """Test backtesting engine."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.backtester = Backtester(initial_balance=10000.0)
        
    def test_backtester_initialization(self):
        """Test backtester is initialized correctly."""
        self.assertEqual(self.backtester.initial_balance, 10000.0)
        self.assertEqual(self.backtester.balance, 10000.0)
        self.assertIsNone(self.backtester.position)
        self.assertEqual(len(self.backtester.trades), 0)


def run_async_test(coro):
    """Helper to run async test."""
    return asyncio.run(coro)


if __name__ == '__main__':
    unittest.main()
