import os

from dotenv import load_dotenv
from huggingface_hub import InferenceClient
from pinecone import Pinecone


load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

INDEX_NAME = "cryptomind"

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


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


def search_documents(query, top_k=3):
    query_embedding = create_embedding(query)

    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )

    return results


if __name__ == "__main__":

    query = "How does Ethereum secure its network?"

    print(f"\nQuery: {query}\n")

    results = search_documents(
        query,
        top_k=3
    )

    print("Retrieved documents:\n")

    for match in results["matches"]:

        metadata = match.get(
            "metadata",
            {}
        )

        print(
            f"Score: {match['score']:.4f}"
        )

        print(
            f"Source: "
            f"{metadata.get('source', 'Unknown')}"
        )

        print(
            f"Chunk: "
            f"{metadata.get('chunk_id', 'N/A')}"
        )

        print(
            f"Text:\n"
            f"{metadata.get('text', 'No text available')}"
        )

        print("-" * 60)