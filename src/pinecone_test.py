import os
import uuid

from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from pinecone import Pinecone


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")


# ============================================================
# CLIENTS
# ============================================================

hf_client = InferenceClient(
    provider="hf-inference",
    api_key=HF_TOKEN
)

pc = Pinecone(
    api_key=PINECONE_API_KEY
)


# ============================================================
# SETTINGS
# ============================================================

INDEX_NAME = "cryptomind"

EMBEDDING_MODEL = (
    "sentence-transformers/all-MiniLM-L6-v2"
)


# ============================================================
# GET INDEX
# ============================================================

index = pc.Index(
    INDEX_NAME
)


# ============================================================
# CREATE EMBEDDING
# ============================================================

def create_embedding(text):

    embedding = hf_client.feature_extraction(
        text,
        model=EMBEDDING_MODEL
    )

    return embedding.tolist()


# ============================================================
# INSERT TEST DOCUMENT
# ============================================================

document = (
    "Ethereum is a blockchain platform that uses "
    "proof of stake to secure its network. "
    "Validators participate in the consensus process "
    "and help verify transactions."
)

print("\nCreating embedding...")

vector = create_embedding(
    document
)

print(
    f"Embedding dimensions: {len(vector)}"
)


# ============================================================
# STORE VECTOR
# ============================================================

vector_id = str(
    uuid.uuid4()
)

index.upsert(
    vectors=[
        {
            "id": vector_id,
            "values": vector,
            "metadata": {
                "text": document,
                "source": "test"
            }
        }
    ]
)


print(
    f"Vector inserted successfully!"
)

print(
    f"Vector ID: {vector_id}"
)


# ============================================================
# SEARCH
# ============================================================

query = (
    "How does Ethereum secure its blockchain?"
)

print(
    "\nSearching Pinecone..."
)

query_vector = create_embedding(
    query
)


results = index.query(
    vector=query_vector,
    top_k=3,
    include_metadata=True
)


# ============================================================
# DISPLAY RESULTS
# ============================================================

print(
    "\nSearch results:\n"
)

for match in results["matches"]:

    print(
        f"Score: {match['score']:.4f}"
    )

    print(
        f"Text: "
        f"{match['metadata']['text']}"
    )

    print(
        f"Source: "
        f"{match['metadata']['source']}"
    )

    print(
        "-" * 60
    )