import logging
from pathlib import Path
from typing import List, Dict, Any

from langchain_text_splitters import RecursiveCharacterTextSplitter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("document_loader")

DOCUMENTS_DIR = Path("data/documents")


def load_documents_from_directory(directory_path: str = "data/documents") -> List[Dict[str, Any]]:
    target_dir = Path(directory_path)

    if not target_dir.exists() or not target_dir.is_dir():
        logger.warning(f"Directory '{directory_path}' does not exist.")
        return []

    txt_files = sorted(list(target_dir.glob("*.txt")))

    if not txt_files:
        logger.info(f"No .txt documents found in '{directory_path}'.")
        return []

    loaded_documents = []
    for file_path in txt_files:
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                content = file.read().strip()
                if content:
                    loaded_documents.append({
                        "source": file_path.name,
                        "text": content,
                        "path": str(file_path)
                    })
                else:
                    logger.warning(f"Skipping empty document: {file_path.name}")
        except Exception as err:
            logger.error(f"Failed to load document {file_path.name}: {err}")

    logger.info(f"Discovered and loaded {len(loaded_documents)} document(s) from '{directory_path}'.")
    return loaded_documents


def split_documents(
    documents: List[Dict[str, Any]],
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> List[Dict[str, Any]]:

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    all_chunks = []
    for doc in documents:
        chunks = splitter.split_text(doc["text"])
        for idx, chunk_text in enumerate(chunks, start=1):
            all_chunks.append({
                "source": doc["source"],
                "chunk_id": idx,
                "text": chunk_text
            })

    return all_chunks


# Backward compatibility helpers
def load_document(file_path: str = "data/documents/ethereum.txt") -> str:
    path = Path(file_path)
    if not path.exists():
        return ""
    with open(path, "r", encoding="utf-8") as file:
        return file.read()


def split_document(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    return splitter.split_text(text)


if __name__ == "__main__":
    docs = load_documents_from_directory()
    print(f"Loaded documents: {[d['source'] for d in docs]}")
    chunks = split_documents(docs)
    print(f"Total chunks created: {len(chunks)}")