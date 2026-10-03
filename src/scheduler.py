import logging
from typing import Dict, Any, Optional
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

try:
    from .config import (
        INGESTION_ENABLED,
        INGESTION_INTERVAL_MINUTES,
        INGESTION_RUN_ON_STARTUP,
    )
    from .pipeline import execute_ingestion_cycle
except ImportError:
    from config import (
        INGESTION_ENABLED,
        INGESTION_INTERVAL_MINUTES,
        INGESTION_RUN_ON_STARTUP,
    )
    from pipeline import execute_ingestion_cycle

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingestion_scheduler")

_scheduler: Optional[BackgroundScheduler] = None


def scheduled_job():

    logger.info("Scheduler triggered background ingestion cycle...")
    try:
        execute_ingestion_cycle(mode="incremental")
    except Exception as err:
        logger.error(f"Scheduled ingestion job encountered error: {err}")


def start_scheduler():

    global _scheduler

    if not INGESTION_ENABLED:
        logger.info("Ingestion scheduler is disabled via INGESTION_ENABLED configuration.")
        return

    if _scheduler is not None and _scheduler.running:
        logger.info("Ingestion scheduler is already running.")
        return

    _scheduler = BackgroundScheduler(daemon=True)

    trigger = IntervalTrigger(minutes=INGESTION_INTERVAL_MINUTES)
    _scheduler.add_job(
        scheduled_job,
        trigger=trigger,
        id="crypto_market_ingestion_job",
        name="CryptoMind Scheduled Market Ingestion",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=300,
    )

    _scheduler.start()
    logger.info(f"Ingestion scheduler started successfully. Interval: every {INGESTION_INTERVAL_MINUTES} minutes.")

    if INGESTION_RUN_ON_STARTUP:
        logger.info("INGESTION_RUN_ON_STARTUP is enabled. Queueing initial startup ingestion...")
        _scheduler.add_job(scheduled_job, id="startup_ingestion_job", replace_existing=True)


def stop_scheduler():

    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Ingestion scheduler stopped.")
        _scheduler = None


def get_scheduler_info() -> Dict[str, Any]:

    global _scheduler
    is_running = _scheduler is not None and _scheduler.running

    next_run = None
    if is_running:
        job = _scheduler.get_job("crypto_market_ingestion_job")
        if job and job.next_run_time:
            next_run = job.next_run_time.isoformat()

    return {
        "enabled": INGESTION_ENABLED,
        "running": is_running,
        "interval_minutes": INGESTION_INTERVAL_MINUTES,
        "run_on_startup": INGESTION_RUN_ON_STARTUP,
        "next_run_time": next_run,
    }


if __name__ == "__main__":
    start_scheduler()
    print(get_scheduler_info())
    stop_scheduler()
