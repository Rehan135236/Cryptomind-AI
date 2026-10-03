import os
import logging
from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from pinecone import Pinecone

try:
    from .document_loader import (
        load_documents_from_directory,
        split_documents
    )
except ImportError:
    from document_loader import (
        load_documents_from_directory,
        split_documents
    )

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ingest_documents")

HF_TOKEN = os.getenv("HF_TOKEN")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

INDEX_NAME = "cryptomind"
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def get_hf_client():
    return InferenceClient(
        provider="hf-inference",
        api_key=HF_TOKEN
    )


def get_pinecone_index():
    pc = Pinecone(api_key=PINECONE_API_KEY)
    return pc.Index(INDEX_NAME)


def create_embedding(text: str, hf_client=None):
    if hf_client is None:
        hf_client = get_hf_client()
    embedding = hf_client.feature_extraction(
        text,
        model=EMBEDDING_MODEL
    )
    if hasattr(embedding, "tolist"):
        return embedding.tolist()
    return list(embedding)


def ingest_documents(directory_path: str = "data/documents"):

    print("\n" + "=" * 60)
    print("CRYPTOMIND RAG DOCUMENT INGESTION")
    print("=" * 60)

    # 1. Discover and load documents
    documents = load_documents_from_directory(directory_path)

    if not documents:
        print(f"No documents found in {directory_path}.")
        print("=" * 60)
        return {
            "status": "empty",
            "documents_count": 0,
            "chunks_count": 0,
            "vectors_upserted": 0,
        }

    sources = [doc["source"] for doc in documents]
    print(f"Discovered {len(documents)} document(s): {', '.join(sources)}")

    # 2. Chunk documents
    chunks = split_documents(documents, chunk_size=500, chunk_overlap=50)
    print(f"Split documents into {len(chunks)} total chunk(s).")

    # 3. Generate embeddings & build deterministic vector payloads
    hf_client = get_hf_client()
    index = get_pinecone_index()
    vectors = []

    for i, chunk in enumerate(chunks, start=1):
        source = chunk["source"]
        chunk_id = chunk["chunk_id"]
        chunk_text = chunk["text"]

        # Deterministic Vector ID Strategy
        vector_id = f"{source}:chunk:{chunk_id}"

        logger.info(f"Generating embedding for chunk {i}/{len(chunks)} [{vector_id}]...")
        embedding = create_embedding(chunk_text, hf_client=hf_client)

        vectors.append({
            "id": vector_id,
            "values": embedding,
            "metadata": {
                "text": chunk_text,
                "source": source,
                "chunk_id": chunk_id,
            }
        })

    # 4. Upsert to Pinecone
    print(f"\nUpserting {len(vectors)} vector(s) to Pinecone index '{INDEX_NAME}'...")
    index.upsert(vectors=vectors)

    print("\n" + "=" * 60)
    print("INGESTION SUMMARY")
    print("=" * 60)
    print(f"Documents Loaded : {len(documents)} ({', '.join(sources)})")
    print(f"Chunks Created   : {len(chunks)}")
    print(f"Vectors Upserted : {len(vectors)}")
    print(f"Pinecone Index   : {INDEX_NAME}")
    print(f"Embedding Model  : {EMBEDDING_MODEL}")
    print("=" * 60 + "\n")

    return {
        "status": "success",
        "documents_count": len(documents),
        "chunks_count": len(chunks),
        "vectors_upserted": len(vectors),
        "sources": sources,
    }


def ingest_document():
    """Backward compatibility wrapper."""
    return ingest_documents()


if __name__ == "__main__":
    ingest_documents()