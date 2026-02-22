"""
Simple Moving Average (SMA) crossover strategy.
Generates buy signals when short-term MA crosses above long-term MA,
and sell signals when short-term MA crosses below long-term MA.
"""

from typing import List
from . import Strategy
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class SimpleMovingAverage(Strategy):
    """
    Simple Moving Average crossover strategy.
    """
    
    def __init__(self, short_window: int = 10, long_window: int = 30):
        """
        Initialize SMA strategy.
        
        Args:
            short_window: Period for short-term moving average
            long_window: Period for long-term moving average
        """
        super().__init__(name="SimpleMovingAverage")
        self.short_window = short_window
        self.long_window = long_window
        self.last_signal = 'hold'
        
    async def analyze(self, ohlcv_data: List[List]) -> str:
        """
        Analyze price data using SMA crossover strategy.
        
        Args:
            ohlcv_data: OHLCV candlestick data
            
        Returns:
            Trading signal: 'buy', 'sell', or 'hold'
        """
        if len(ohlcv_data) < self.long_window:
            logger.warning(f"Not enough data for analysis. Need {self.long_window}, got {len(ohlcv_data)}")
            return 'hold'
        
        # Convert to DataFrame
        df = self.convert_to_dataframe(ohlcv_data)
        
        # Calculate moving averages
        df['sma_short'] = df['close'].rolling(window=self.short_window).mean()
        df['sma_long'] = df['close'].rolling(window=self.long_window).mean()
        
        # Get the last two rows to detect crossover
        if len(df) < 2:
            return 'hold'
        
        current = df.iloc[-1]
        previous = df.iloc[-2]
        
        # Check for valid MA values
        if pd.isna(current['sma_short']) or pd.isna(current['sma_long']):
            return 'hold'
        
        # Detect crossover
        signal = 'hold'
        
        # Bullish crossover: short MA crosses above long MA
        if (previous['sma_short'] <= previous['sma_long'] and 
            current['sma_short'] > current['sma_long']):
            if self.position != 'long':
                signal = 'buy'
                logger.info(f"Bullish crossover detected: SMA_short={current['sma_short']:.2f}, SMA_long={current['sma_long']:.2f}")
        
        # Bearish crossover: short MA crosses below long MA
        elif (previous['sma_short'] >= previous['sma_long'] and 
              current['sma_short'] < current['sma_long']):
            if self.position == 'long':
                signal = 'sell'
                logger.info(f"Bearish crossover detected: SMA_short={current['sma_short']:.2f}, SMA_long={current['sma_long']:.2f}")
        
        self.last_signal = signal
        return signal
