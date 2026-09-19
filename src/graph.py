import os
import json
from typing import TypedDict

from dotenv import load_dotenv
from groq import Groq

from langgraph.graph import StateGraph, START, END

from .tools import (
    get_crypto_analysis,
    compare_crypto_assets
)


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# GROQ CLIENT
# ============================================================

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

MODEL = "openai/gpt-oss-120b"


# ============================================================
# LANGGRAPH STATE
# ============================================================

class CryptoMindState(TypedDict):
    messages: list[dict]


# ============================================================
# TOOL DEFINITIONS
# ============================================================

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_crypto_analysis",
            "description": (
                "Get quantitative market analysis for one "
                "cryptocurrency using CryptoMind's PostgreSQL "
                "database."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": (
                            "Cryptocurrency symbol such as BTC, "
                            "ETH, SOL or BNB."
                        )
                    }
                },
                "required": ["symbol"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_crypto_assets",
            "description": (
                "Compare multiple cryptocurrencies using "
                "CryptoMind's quantitative market analytics."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "symbols": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": (
                            "List of cryptocurrency symbols "
                            "such as BTC, ETH, SOL and BNB."
                        )
                    }
                },
                "required": ["symbols"]
            }
        }
    }
]


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are CryptoMind, an AI crypto research assistant.

You analyze cryptocurrency market data using tools connected
to CryptoMind's PostgreSQL database.

Rules:

1. Use the available tools whenever the user asks for
   quantitative cryptocurrency market information.

2. Never invent prices, returns, volatility, drawdown,
   Sharpe ratios, moving averages, or other market metrics.

3. Treat tool results as the source of truth.

4. Clearly distinguish between:
   - Data
   - Interpretation

5. Do not provide personalized investment advice.

6. Do not give buy, sell, or hold recommendations.

7. When comparing cryptocurrencies, explain the differences
   using the actual metrics returned by the tools.

8. Keep the final answer clear and concise.
"""


# ============================================================
# TOOL EXECUTION
# ============================================================

def execute_tool(tool_name, tool_args):

    print(f"\nExecuting tool: {tool_name}")
    print(f"Arguments: {tool_args}")

    if tool_name == "get_crypto_analysis":

        result = get_crypto_analysis(
            tool_args["symbol"]
        )

    elif tool_name == "compare_crypto_assets":

        result = compare_crypto_assets(
            tool_args["symbols"]
        )

    else:

        result = {
            "error": f"Unknown tool: {tool_name}"
        }

    print("\nTool result:")
    print(result)

    return result


# ============================================================
# LLM NODE
# ============================================================

def llm_node(state: CryptoMindState):

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        }
    ]

    messages.extend(
        state["messages"]
    )

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=tools,
        tool_choice="auto",
        temperature=0.2
    )

    message = response.choices[0].message

    # --------------------------------------------------------
    # Convert assistant response to native Groq format
    # --------------------------------------------------------

    assistant_message = {
        "role": "assistant",
        "content": message.content or ""
    }

    if message.tool_calls:

        assistant_message["tool_calls"] = []

        for tool_call in message.tool_calls:

            assistant_message["tool_calls"].append(
                {
                    "id": tool_call.id,
                    "type": "function",
                    "function": {
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments
                    }
                }
            )

    return {
        "messages": [assistant_message]
    }


# ============================================================
# TOOL NODE
# ============================================================

def tool_node(state: CryptoMindState):

    last_message = state["messages"][-1]

    tool_messages = []

    for tool_call in last_message["tool_calls"]:

        tool_call_id = tool_call["id"]

        function_data = tool_call["function"]

        tool_name = function_data["name"]

        tool_args = json.loads(
            function_data["arguments"]
        )

        result = execute_tool(
            tool_name,
            tool_args
        )

        # ----------------------------------------------------
        # IMPORTANT:
        # This is the exact native Groq tool-result format.
        # ----------------------------------------------------

        tool_message = {
            "role": "tool",
            "tool_call_id": tool_call_id,
            "name": tool_name,
            "content": json.dumps(
                result,
                default=str
            )
        }

        tool_messages.append(
            tool_message
        )

    return {
        "messages": tool_messages
    }


# ============================================================
# ROUTING
# ============================================================

def should_continue(state: CryptoMindState):

    last_message = state["messages"][-1]

    if last_message.get("tool_calls"):
        return "tools"

    return END


# ============================================================
# BUILD GRAPH
# ============================================================

graph_builder = StateGraph(
    CryptoMindState
)


graph_builder.add_node(
    "llm",
    llm_node
)

graph_builder.add_node(
    "tools",
    tool_node
)


# START → LLM

graph_builder.add_edge(
    START,
    "llm"
)


# LLM → TOOLS or END

graph_builder.add_conditional_edges(
    "llm",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)


# TOOLS → LLM

graph_builder.add_edge(
    "tools",
    "llm"
)


graph = graph_builder.compile()


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    initial_state: CryptoMindState = {

        "messages": [

            {
                "role": "user",
                "content": (
                    "Compare BTC, ETH, SOL and BNB "
                    "using CryptoMind's market data."
                )
            }

        ]

    }

    print(
        "\nStarting CryptoMind LangGraph Agent...\n"
    )

    result = graph.invoke(
        initial_state
    )

    print("\n")
    print("=" * 60)
    print("CRYPTOMIND AGENT RESULT")
    print("=" * 60)

    for message in result["messages"]:

        role = message.get(
            "role",
            "unknown"
        )

        print(
            f"\n[{role.upper()}]"
        )

        content = message.get(
            "content"
        )

        if content:
            print(content)

        if message.get("tool_calls"):

            print("\nTool Calls:")

            for call in message["tool_calls"]:

                print(
                    f"  Tool: "
                    f"{call['function']['name']}"
                )

                print(
                    f"  Arguments: "
                    f"{call['function']['arguments']}"
                )

    print(
        "\n" + "=" * 60
    )