"""
Exchange connector module using ccxt with asyncio support.
Handles connection to cryptocurrency exchanges and provides async methods for trading operations.
"""

import ccxt.async_support as ccxt
import asyncio
from typing import Optional, Dict, List, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ExchangeConnector:
    """
    Async exchange connector using ccxt library.
    Provides methods for fetching market data and executing trades.
    """
    
    def __init__(self, exchange_config: Dict[str, Any]):
        """
        Initialize exchange connector.
        
        Args:
            exchange_config: Configuration dictionary with exchange settings
        """
        self.exchange_name = exchange_config.get('name', 'binance')
        self.config = exchange_config
        self.exchange: Optional[ccxt.Exchange] = None
        
    async def connect(self) -> None:
        """Establish connection to the exchange."""
        try:
            exchange_class = getattr(ccxt, self.exchange_name)
            self.exchange = exchange_class({
                'apiKey': self.config.get('api_key', ''),
                'secret': self.config.get('secret', ''),
                'enableRateLimit': self.config.get('enableRateLimit', True),
                'options': self.config.get('options', {})
            })
            await self.exchange.load_markets()
            logger.info(f"Connected to {self.exchange_name}")
        except Exception as e:
            logger.error(f"Failed to connect to exchange: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close exchange connection."""
        if self.exchange:
            await self.exchange.close()
            logger.info("Exchange connection closed")
    
    async def fetch_ticker(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch current ticker for a symbol.
        
        Args:
            symbol: Trading pair symbol (e.g., 'BTC/USDT')
            
        Returns:
            Ticker data dictionary
        """
        if not self.exchange:
            raise RuntimeError("Exchange not connected")
        return await self.exchange.fetch_ticker(symbol)
    
    async def fetch_ohlcv(self, symbol: str, timeframe: str = '1m', 
                          limit: int = 100) -> List[List]:
        """
        Fetch OHLCV (candlestick) data.
        
        Args:
            symbol: Trading pair symbol
            timeframe: Candlestick timeframe (e.g., '1m', '5m', '1h')
            limit: Number of candles to fetch
            
        Returns:
            List of OHLCV data [[timestamp, open, high, low, close, volume], ...]
        """
        if not self.exchange:
            raise RuntimeError("Exchange not connected")
        return await self.exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
    
    async def fetch_balance(self) -> Dict[str, Any]:
        """
        Fetch account balance.
        
        Returns:
            Balance information dictionary
        """
        if not self.exchange:
            raise RuntimeError("Exchange not connected")
        return await self.exchange.fetch_balance()
    
    async def create_market_order(self, symbol: str, side: str, 
                                  amount: float) -> Dict[str, Any]:
        """
        Create a market order.
        
        Args:
            symbol: Trading pair symbol
            side: 'buy' or 'sell'
            amount: Order amount
            
        Returns:
            Order information dictionary
        """
        if not self.exchange:
            raise RuntimeError("Exchange not connected")
        
        logger.info(f"Creating {side} market order for {amount} {symbol}")
        order = await self.exchange.create_market_order(symbol, side, amount)
        logger.info(f"Order created: {order['id']}")
        return order
    
    async def create_limit_order(self, symbol: str, side: str, 
                                 amount: float, price: float) -> Dict[str, Any]:
        """
        Create a limit order.
        
        Args:
            symbol: Trading pair symbol
            side: 'buy' or 'sell'
            amount: Order amount
            price: Limit price
            
        Returns:
            Order information dictionary
        """
        if not self.exchange:
            raise RuntimeError("Exchange not connected")
        
        logger.info(f"Creating {side} limit order for {amount} {symbol} at {price}")
        order = await self.exchange.create_limit_order(symbol, side, amount, price)
        logger.info(f"Order created: {order['id']}")
        return order
    
    async def cancel_order(self, order_id: str, symbol: str) -> Dict[str, Any]:
        """
        Cancel an existing order.
        
        Args:
            order_id: Order ID to cancel
            symbol: Trading pair symbol
            
        Returns:
            Cancelled order information
        """
        if not self.exchange:
            raise RuntimeError("Exchange not connected")
        
        logger.info(f"Cancelling order {order_id}")
        return await self.exchange.cancel_order(order_id, symbol)
    
    async def fetch_open_orders(self, symbol: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch open orders.
        
        Args:
            symbol: Optional trading pair symbol to filter
            
        Returns:
            List of open orders
        """
        if not self.exchange:
            raise RuntimeError("Exchange not connected")
        return await self.exchange.fetch_open_orders(symbol)
