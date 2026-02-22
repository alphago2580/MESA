"""
Base strategy class for implementing trading strategies.
All custom strategies should inherit from this class.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import pandas as pd
import logging

logger = logging.getLogger(__name__)


class Strategy(ABC):
    """
    Abstract base class for trading strategies.
    """
    
    def __init__(self, name: str):
        """
        Initialize strategy.
        
        Args:
            name: Strategy name
        """
        self.name = name
        self.position: Optional[str] = None  # None, 'long', or 'short'
        self.entry_price: float = 0.0
        
    @abstractmethod
    async def analyze(self, ohlcv_data: List[List]) -> str:
        """
        Analyze market data and generate trading signal.
        
        Args:
            ohlcv_data: OHLCV candlestick data
            
        Returns:
            Trading signal: 'buy', 'sell', or 'hold'
        """
        pass
    
    def convert_to_dataframe(self, ohlcv_data: List[List]) -> pd.DataFrame:
        """
        Convert OHLCV data to pandas DataFrame.
        
        Args:
            ohlcv_data: Raw OHLCV data from exchange
            
        Returns:
            DataFrame with columns: timestamp, open, high, low, close, volume
        """
        df = pd.DataFrame(
            ohlcv_data,
            columns=['timestamp', 'open', 'high', 'low', 'close', 'volume']
        )
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        return df
    
    def set_position(self, position: Optional[str], entry_price: float = 0.0) -> None:
        """
        Set current position.
        
        Args:
            position: 'long', 'short', or None
            entry_price: Entry price for the position
        """
        self.position = position
        self.entry_price = entry_price
        logger.info(f"Position set to {position} at {entry_price}")
    
    def get_position(self) -> Dict[str, Any]:
        """
        Get current position information.
        
        Returns:
            Dictionary with position and entry_price
        """
        return {
            'position': self.position,
            'entry_price': self.entry_price
        }
