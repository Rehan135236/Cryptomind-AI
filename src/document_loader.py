from pathlib import Path

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter
)


DOCUMENT_PATH = Path(
    "data/documents/ethereum.txt"
)


def load_document():
    with open(
        DOCUMENT_PATH,
        "r",
        encoding="utf-8"
    ) as file:
        text = file.read()

    return text


def split_document(text):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.split_text(text)

    return chunks


if __name__ == "__main__":
    print("\nLoading Ethereum document...")

    text = load_document()

    print(
        f"Document length: {len(text)} characters"
    )

    chunks = split_document(text)

    print(
        f"Number of chunks: {len(chunks)}"
    )

    print("\nChunks:\n")

    for i, chunk in enumerate(chunks, start=1):
        print("=" * 60)
        print(f"CHUNK {i}")
        print("=" * 60)
        print(chunk)
        print()