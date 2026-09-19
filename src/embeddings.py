import os

from dotenv import load_dotenv
from huggingface_hub import InferenceClient


load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

client = InferenceClient(
    provider="hf-inference",
    api_key=HF_TOKEN
)


MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def create_embedding(text: str):

    embedding = client.feature_extraction(
        text,
        model=MODEL
    )

    return embedding


if __name__ == "__main__":

    text = (
        "Ethereum is a blockchain platform that uses "
        "proof of stake to secure its network."
    )

    print("Generating embedding...\n")

    embedding = create_embedding(text)

    print("Embedding generated!")
    print("Type:", type(embedding))

    try:
        print("Dimensions:", len(embedding))
        print("\nFirst 10 values:")
        print(embedding[:10])

    except TypeError:
        print("\nEmbedding output:")
        print(embedding)