import asyncio
import collections
import json
import logging
import time
from typing import Any, AsyncGenerator, Dict, List
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/api/logs", tags=["Logs"])

# In-memory circular buffer of recent logs (up to 400 entries)
log_buffer: collections.deque = collections.deque(maxlen=400)
active_subscribers: List[asyncio.Queue] = []


def emit_log(message: str, level: str = "INFO", source: str = "BACKEND") -> None:
    """Emits a formatted log message to the circular buffer and all live SSE listeners."""
    entry: Dict[str, Any] = {
        "id": f"log-{int(time.time() * 1000)}-{len(log_buffer)}",
        "timestamp": time.strftime("%H:%M:%S"),
        "level": level.upper(),
        "source": source.upper(),
        "message": message,
    }
    log_buffer.append(entry)

    # Push to live SSE subscribers
    dead_queues = []
    for q in active_subscribers:
        try:
            q.put_nowait(entry)
        except Exception:
            dead_queues.append(q)

    for dead in dead_queues:
        if dead in active_subscribers:
            active_subscribers.remove(dead)


class BufferingLogHandler(logging.Handler):
    """Logging handler that captures system logs from uvicorn and app into the buffer."""
    def emit(self, record: logging.LogRecord) -> None:
        try:
            msg = self.format(record)
            level = record.levelname
            source = "UVICORN" if "uvicorn" in record.name else "BACKEND"
            emit_log(msg, level=level, source=source)
        except Exception:
            pass


system_log_handler = BufferingLogHandler()
system_log_handler.setLevel(logging.INFO)
system_log_handler.setFormatter(logging.Formatter("%(message)s"))


@router.get("")
def get_recent_logs() -> List[Dict[str, Any]]:
    """Returns the most recent buffered log entries."""
    return list(log_buffer)


@router.get("/stream")
async def stream_logs():
    """SSE endpoint streaming backend log entries in real-time."""
    queue: asyncio.Queue = asyncio.Queue()
    active_subscribers.append(queue)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # First send initial connection event
            init_event = {
                "id": f"init-{int(time.time() * 1000)}",
                "timestamp": time.strftime("%H:%M:%S"),
                "level": "INFO",
                "source": "SYSTEM",
                "message": "🟢 Conectado ao stream de logs do Backend FastAPI em tempo real.",
            }
            yield f"data: {json.dumps(init_event)}\n\n"

            while True:
                entry = await queue.get()
                yield f"data: {json.dumps(entry)}\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            if queue in active_subscribers:
                active_subscribers.remove(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        },
    )
