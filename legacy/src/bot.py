"""
Main trading bot that coordinates exchange connection, strategy execution, and trading.
"""

import asyncio
from typing import Dict, Any, Optional
import logging
from src.exchange import ExchangeConnector
from src.strategies import Strategy

logger = logging.getLogger(__name__)


class TradingBot:
    """
    Main trading bot class that executes strategies in real-time.
    """
    
    def __init__(self, exchange_config: Dict[str, Any], 
                 trading_config: Dict[str, Any], 
                 strategy: Strategy):
        """
        Initialize trading bot.
        
        Args:
            exchange_config: Exchange configuration
            trading_config: Trading parameters
            strategy: Trading strategy instance
        """
        self.exchange = ExchangeConnector(exchange_config)
        self.trading_config = trading_config
        self.strategy = strategy
        self.symbol = trading_config.get('symbol', 'BTC/USDT')
        self.timeframe = trading_config.get('timeframe', '1m')
        self.amount = trading_config.get('amount', 0.001)
        self.is_running = False
        
    async def start(self) -> None:
        """Start the trading bot."""
        logger.info(f"Starting trading bot for {self.symbol}")
        
        try:
            # Connect to exchange
            await self.exchange.connect()
            
            # Main trading loop
            self.is_running = True
            while self.is_running:
                await self._trading_loop()
                
                # Wait before next iteration
                await asyncio.sleep(60)  # Check every minute
                
        except Exception as e:
            logger.error(f"Error in trading bot: {e}")
            raise
        finally:
            await self.exchange.disconnect()
    
    async def stop(self) -> None:
        """Stop the trading bot."""
        logger.info("Stopping trading bot")
        self.is_running = False
    
    async def _trading_loop(self) -> None:
        """Execute one iteration of the trading loop."""
        try:
            # Fetch market data
            ohlcv_data = await self.exchange.fetch_ohlcv(
                self.symbol, 
                self.timeframe, 
                limit=100
            )
            
            # Get signal from strategy
            signal = await self.strategy.analyze(ohlcv_data)
            
            # Execute trades based on signal
            if signal == 'buy':
                await self._execute_buy()
            elif signal == 'sell':
                await self._execute_sell()
            else:
                logger.debug(f"Signal: {signal}, no action taken")
                
        except Exception as e:
            logger.error(f"Error in trading loop: {e}")
    
    async def _execute_buy(self) -> None:
        """Execute buy order."""
        try:
            # Check if already in position
            position = self.strategy.get_position()
            if position['position'] == 'long':
                logger.info("Already in long position, skipping buy")
                return
            
            # Get current price
            ticker = await self.exchange.fetch_ticker(self.symbol)
            current_price = ticker['last']
            
            # Create market buy order
            logger.info(f"Executing BUY order: {self.amount} {self.symbol} at ~{current_price}")
            order = await self.exchange.create_market_order(
                self.symbol, 
                'buy', 
                self.amount
            )
            
            # Update strategy position
            self.strategy.set_position('long', current_price)
            logger.info(f"BUY order executed: {order['id']}")
            
        except Exception as e:
            logger.error(f"Error executing buy order: {e}")
    
    async def _execute_sell(self) -> None:
        """Execute sell order."""
        try:
            # Check if in position
            position = self.strategy.get_position()
            if position['position'] != 'long':
                logger.info("No long position to close, skipping sell")
                return
            
            # Get current price
            ticker = await self.exchange.fetch_ticker(self.symbol)
            current_price = ticker['last']
            
            # Calculate profit
            entry_price = position['entry_price']
            profit_pct = ((current_price - entry_price) / entry_price) * 100
            
            # Create market sell order
            logger.info(f"Executing SELL order: {self.amount} {self.symbol} at ~{current_price}")
            logger.info(f"Profit: {profit_pct:.2f}%")
            order = await self.exchange.create_market_order(
                self.symbol, 
                'sell', 
                self.amount
            )
            
            # Update strategy position
            self.strategy.set_position(None)
            logger.info(f"SELL order executed: {order['id']}")
            
        except Exception as e:
            logger.error(f"Error executing sell order: {e}")
    
    async def get_account_info(self) -> Dict[str, Any]:
        """
        Get account balance and position information.
        
        Returns:
            Dictionary with account information
        """
        balance = await self.exchange.fetch_balance()
        position = self.strategy.get_position()
        
        return {
            'balance': balance,
            'position': position
        }
