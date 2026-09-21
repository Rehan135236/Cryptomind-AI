import os

from dotenv import load_dotenv
from groq import Groq

from .rag import search_documents


load_dotenv()

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)

client = Groq(
    api_key=GROQ_API_KEY
)

MODEL = "openai/gpt-oss-120b"


SYSTEM_PROMPT = """
You are CryptoMind, an AI crypto research assistant.

Answer the user's question using ONLY the
retrieved context provided to you.

Rules:

1. Do not use outside knowledge.

2. Do not invent or guess information.

3. If the retrieved context does not contain
   enough information to answer the question,
   clearly say:

   "The available documents do not contain
   enough information to answer this question."

4. Only make factual claims that are supported
   by the retrieved context.

5. Clearly distinguish factual information
   from interpretation.

6. Keep answers concise and easy to understand.

7. When answering from retrieved information,
   mention the document source and chunk number.

8. If the retrieved context is unrelated to the
   question, do not use it to construct an answer.
"""


def build_context(results):

    context_parts = []

    for match in results["matches"]:

        metadata = match.get(
            "metadata",
            {}
        )

        source = metadata.get(
            "source",
            "Unknown"
        )

        chunk_id = metadata.get(
            "chunk_id",
            "N/A"
        )

        text = metadata.get(
            "text",
            ""
        )

        context_parts.append(
            f"Source: {source}\n"
            f"Chunk: {chunk_id}\n"
            f"Content: {text}"
        )

    return "\n\n---\n\n".join(
        context_parts
    )


def answer_question(question):

    print("\nSearching documents...")

    results = search_documents(
        question,
        top_k=3
    )

    context = build_context(
        results
    )

    prompt = f"""
Retrieved context:

{context}

User question:

{question}

Answer the question using ONLY
the retrieved context.
"""

    print("Generating answer...")

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2
    )

    return response.choices[0].message.content


if __name__ == "__main__":

    question = (
        "Who founded Ethereum?"
    )

    print(
        "\n" + "=" * 60
    )

    print(
        "CRYPTOMIND RAG"
    )

    print(
        "=" * 60
    )

    print(
        f"\nQuestion: {question}"
    )

    answer = answer_question(
        question
    )

    print(
        "\nAnswer:\n"
    )

    print(answer)

    print(
        "\n" + "=" * 60
    )