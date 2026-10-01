import pytest
from src.scheduler import start_scheduler, stop_scheduler, get_scheduler_info
from src.pipeline import _ingestion_lock


def test_scheduler_lifecycle():
    start_scheduler()
    info = get_scheduler_info()
    assert info["enabled"] is True
    assert info["running"] is True

    stop_scheduler()
    info_stopped = get_scheduler_info()
    assert info_stopped["running"] is False


def test_overlapping_run_lock():
    acquired = _ingestion_lock.acquire(blocking=False)
    assert acquired is True
    try:
        # Second acquire should fail immediately
        second_acquire = _ingestion_lock.acquire(blocking=False)
        assert second_acquire is False
    finally:
        _ingestion_lock.release()
