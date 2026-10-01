from src.pipeline import execute_ingestion_cycle


def seed_tracked_assets():
    """
    Manual historical backfill / seed command for tracked assets.
    Reuses the authoritative ingestion engine in src/pipeline.py.
    """
    print("Executing historical asset seed via authoritative ingestion engine...")
    return execute_ingestion_cycle(mode="incremental")


if __name__ == "__main__":
    seed_tracked_assets()
