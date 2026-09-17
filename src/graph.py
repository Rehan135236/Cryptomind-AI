import os
from typing import TypedDict

from dotenv import load_dotenv

from langchain_core.messages import AnyMessage
from langchain_groq import ChatGroq


# ============================================================
# Load environment variables
# ============================================================

load_dotenv()


# ============================================================
# State
# ============================================================

class CryptoMindState(TypedDict):

    messages: list[AnyMessage]


# ============================================================
# LLM
# ============================================================

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0.2,
    api_key=os.getenv("GROQ_API_KEY")
)


# ============================================================
# LLM Node
# ============================================================

def llm_node(state: CryptoMindState):

    messages = state["messages"]

    response = llm.invoke(messages)

    return {
        "messages": messages + [response]
    }


# ============================================================
# Test
# ============================================================

if __name__ == "__main__":

    from langchain_core.messages import HumanMessage

    state: CryptoMindState = {
        "messages": [
            HumanMessage(
                content="What is Bitcoin?"
            )
        ]
    }

    new_state = llm_node(state)

    print("\nLLM response:\n")

    print(
        new_state["messages"][-1].content
    )