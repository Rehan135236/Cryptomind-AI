import os

from dotenv import load_dotenv
from pinecone import Pinecone


load_dotenv()

PINECONE_API_KEY = os.getenv(
    "PINECONE_API_KEY"
)

INDEX_NAME = "cryptomind"

pc = Pinecone(
    api_key=PINECONE_API_KEY
)

index = pc.Index(
    INDEX_NAME
)


print("\nChecking Pinecone index...")

stats = index.describe_index_stats()

print(
    f"Total vectors before cleanup: "
    f"{stats['total_vector_count']}"
)


print("\nFinding test vectors...")

results = index.query(
    vector=[0.0] * 384,
    top_k=100,
    include_metadata=True
)


test_ids = []

for match in results["matches"]:

    metadata = match.get(
        "metadata",
        {}
    )

    if metadata.get("source") == "test":
        test_ids.append(
            match["id"]
        )


if not test_ids:
    print("No test vectors found.")
else:
    print(
        f"Found {len(test_ids)} test vector(s)."
    )

    index.delete(
        ids=test_ids
    )

    print(
        "Test vectors deleted successfully!"
    )


stats = index.describe_index_stats()

print(
    f"\nTotal vectors after cleanup: "
    f"{stats['total_vector_count']}"
)