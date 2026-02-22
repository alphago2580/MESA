"""
Backtesting module for testing trading strategies on historical data.
"""

from typing import Dict, Any, List
import pandas as pd
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class Backtester:
    """
    Simple backtesting engine for strategy evaluation.
    """
    
    def __init__(self, initial_balance: float = 10000.0):
        """
        Initialize backtester.
        
        Args:
            initial_balance: Starting capital for backtesting
        """
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.position = None
        self.position_size = 0.0
        self.entry_price = 0.0
        self.trades: List[Dict[str, Any]] = []
        
    async def run(self, strategy, ohlcv_data: List[List], 
                  trade_amount: float = 0.1) -> Dict[str, Any]:
        """
        Run backtest on historical data.
        
        Args:
            strategy: Trading strategy instance
            ohlcv_data: Historical OHLCV data
            trade_amount: Percentage of balance to use per trade (0.0 to 1.0)
            
        Returns:
            Dictionary with backtest results
        """
        logger.info(f"Starting backtest with {self.initial_balance} initial balance")
        
        # Convert to DataFrame for easier processing
        df = pd.DataFrame(
            ohlcv_data,
            columns=['timestamp', 'open', 'high', 'low', 'close', 'volume']
        )
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        
        # Iterate through data points
        for i in range(len(df)):
            # Get data up to current point
            current_data = ohlcv_data[:i+1]
            
            # Skip if not enough data
            if len(current_data) < 30:
                continue
            
            # Get signal from strategy
            signal = await strategy.analyze(current_data)
            current_price = df.iloc[i]['close']
            current_time = df.iloc[i]['timestamp']
            
            # Execute trades based on signal
            if signal == 'buy' and self.position is None:
                # Open long position
                amount_to_invest = self.balance * trade_amount
                self.position_size = amount_to_invest / current_price
                self.entry_price = current_price
                self.position = 'long'
                self.balance -= amount_to_invest
                
                self.trades.append({
                    'timestamp': current_time,
                    'action': 'buy',
                    'price': current_price,
                    'size': self.position_size,
                    'balance': self.balance
                })
                
                strategy.set_position('long', current_price)
                logger.info(f"BUY: {self.position_size:.4f} at {current_price:.2f}")
                
            elif signal == 'sell' and self.position == 'long':
                # Close long position
                proceeds = self.position_size * current_price
                profit = proceeds - (self.position_size * self.entry_price)
                self.balance += proceeds
                
                self.trades.append({
                    'timestamp': current_time,
                    'action': 'sell',
                    'price': current_price,
                    'size': self.position_size,
                    'balance': self.balance,
                    'profit': profit
                })
                
                logger.info(f"SELL: {self.position_size:.4f} at {current_price:.2f}, Profit: {profit:.2f}")
                
                self.position = None
                self.position_size = 0.0
                self.entry_price = 0.0
                strategy.set_position(None)
        
        # Close any open position at the end
        if self.position == 'long':
            final_price = df.iloc[-1]['close']
            proceeds = self.position_size * final_price
            profit = proceeds - (self.position_size * self.entry_price)
            self.balance += proceeds
            
            self.trades.append({
                'timestamp': df.iloc[-1]['timestamp'],
                'action': 'sell',
                'price': final_price,
                'size': self.position_size,
                'balance': self.balance,
                'profit': profit
            })
            
            logger.info(f"FINAL SELL: {self.position_size:.4f} at {final_price:.2f}, Profit: {profit:.2f}")
        
        # Calculate results
        results = self._calculate_results()
        return results
    
    def _calculate_results(self) -> Dict[str, Any]:
        """
        Calculate backtesting results and statistics.
        
        Returns:
            Dictionary with performance metrics
        """
        total_return = self.balance - self.initial_balance
        return_percentage = (total_return / self.initial_balance) * 100
        
        winning_trades = [t for t in self.trades if t.get('profit', 0) > 0]
        losing_trades = [t for t in self.trades if t.get('profit', 0) < 0]
        
        total_trades = len([t for t in self.trades if 'profit' in t])
        win_rate = (len(winning_trades) / total_trades * 100) if total_trades > 0 else 0
        
        avg_win = sum(t['profit'] for t in winning_trades) / len(winning_trades) if winning_trades else 0
        avg_loss = sum(t['profit'] for t in losing_trades) / len(losing_trades) if losing_trades else 0
        
        results = {
            'initial_balance': self.initial_balance,
            'final_balance': self.balance,
            'total_return': total_return,
            'return_percentage': return_percentage,
            'total_trades': total_trades,
            'winning_trades': len(winning_trades),
            'losing_trades': len(losing_trades),
            'win_rate': win_rate,
            'average_win': avg_win,
            'average_loss': avg_loss,
            'trades': self.trades
        }
        
        logger.info("="*50)
        logger.info("BACKTEST RESULTS")
        logger.info("="*50)
        logger.info(f"Initial Balance: ${self.initial_balance:.2f}")
        logger.info(f"Final Balance: ${self.balance:.2f}")
        logger.info(f"Total Return: ${total_return:.2f} ({return_percentage:.2f}%)")
        logger.info(f"Total Trades: {total_trades}")
        logger.info(f"Win Rate: {win_rate:.2f}%")
        logger.info(f"Average Win: ${avg_win:.2f}")
        logger.info(f"Average Loss: ${avg_loss:.2f}")
        logger.info("="*50)
        
        return results
