import datetime
from typing import Any, Dict


def get_current_utc_time() -> datetime.datetime:
    """Returns the current datetime in UTC timezone."""
    return datetime.datetime.utcnow()


def format_datetime(dt: datetime.datetime) -> str:
    """Converts a datetime object into a standard ISO-8601 string representation."""
    return dt.isoformat() if dt else ""
