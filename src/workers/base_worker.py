"""
Base worker class for background task processing.
"""

import asyncio
from abc import ABC, abstractmethod
from typing import Optional


class BaseWorker(ABC):
    """Base class for all workers."""

    def __init__(self, name: str, interval: float = 1.0):
        """
        Initialize the worker.

        Args:
            name: Worker name for logging
            interval: Sleep interval between task executions (seconds)
        """
        self.name = name
        self.interval = interval
        self._running = False
        self._task: Optional[asyncio.Task] = None

    @abstractmethod
    async def execute(self) -> None:
        """Execute the worker's main task. Must be implemented by subclasses."""
        pass

    async def start(self) -> None:
        """Start the worker."""
        if self._running:
            return

        self._running = True
        self._task = asyncio.create_task(self._run())
        print(f"[{self.name}] Worker started")

    async def stop(self) -> None:
        """Stop the worker."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print(f"[{self.name}] Worker stopped")

    async def _run(self) -> None:
        """Main worker loop."""
        while self._running:
            try:
                await self.execute()
            except Exception as e:
                print(f"[{self.name}] Error: {e}")
            await asyncio.sleep(self.interval)

    @property
    def is_running(self) -> bool:
        """Check if worker is running."""
        return self._running
