import os
import uuid

from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from pinecone import Pinecone

from .document_loader import (
    load_document,
    split_document
)


load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
PINECONE_API_KEY = os.getenv(
    "PINECONE_API_KEY"
)

INDEX_NAME = "cryptomind"

EMBEDDING_MODEL = (
    "sentence-transformers/all-MiniLM-L6-v2"
)


hf_client = InferenceClient(
    provider="hf-inference",
    api_key=HF_TOKEN
)

pc = Pinecone(
    api_key=PINECONE_API_KEY
)

index = pc.Index(
    INDEX_NAME
)


def create_embedding(text):
    embedding = hf_client.feature_extraction(
        text,
        model=EMBEDDING_MODEL
    )

    return embedding.tolist()


def ingest_document():

    print("\nLoading document...")

    text = load_document()

    chunks = split_document(
        text
    )

    print(
        f"Document split into {len(chunks)} chunks."
    )

    vectors = []

    for i, chunk in enumerate(
        chunks,
        start=1
    ):

        print(
            f"Creating embedding for chunk {i}..."
        )

        embedding = create_embedding(
            chunk
        )

        vector_id = str(
            uuid.uuid4()
        )

        vectors.append(
            {
                "id": vector_id,
                "values": embedding,
                "metadata": {
                    "text": chunk,
                    "source": "ethereum.txt",
                    "chunk_id": i
                }
            }
        )

    print(
        "\nUploading vectors to Pinecone..."
    )

    index.upsert(
        vectors=vectors
    )

    print(
        f"Successfully uploaded "
        f"{len(vectors)} vectors!"
    )


if __name__ == "__main__":
    ingest_document()