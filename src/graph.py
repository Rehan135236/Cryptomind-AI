import os
import json
import operator
from typing import TypedDict, Annotated

from dotenv import load_dotenv
from groq import Groq

from langgraph.graph import StateGraph, START, END

from .tools import (
    get_crypto_analysis,
    compare_crypto_assets,
    search_crypto_documents,
    search_crypto_news
)


load_dotenv()


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


MODEL = "openai/gpt-oss-120b"


class CryptoMindState(TypedDict):
    messages: Annotated[
        list[dict],
        operator.add
    ]


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
                            "Cryptocurrency symbol such as "
                            "BTC, ETH, SOL or BNB."
                        )
                    }
                },
                "required": [
                    "symbol"
                ]
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
                "required": [
                    "symbols"
                ]
            }
        }
    },

    {
        "type": "function",
        "function": {
            "name": "search_crypto_documents",
            "description": (
                "Search CryptoMind's crypto knowledge base "
                "for relevant blockchain documentation, "
                "protocol information, and research content."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": (
                            "Question or topic to search for "
                            "in the crypto knowledge base."
                        )
                    }
                },
                "required": [
                    "query"
                ]
            }
        }
    },

    {
        "type": "function",
        "function": {
            "name": "search_crypto_news",
            "description": (
                "Retrieve recent news specifically about "
                "a cryptocurrency such as Bitcoin, Ethereum, "
                "Solana, or BNB."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string",
                        "description": (
                            "Cryptocurrency symbol such as "
                            "BTC, ETH, SOL, or BNB."
                        )
                    },
                    "limit": {
                        "type": "integer",
                        "description": (
                            "Maximum number of relevant "
                            "news articles to retrieve."
                        )
                    }
                },
                "required": [
                    "symbol"
                ]
            }
        }
    }

]


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are CryptoMind, an AI crypto research assistant.

You analyze cryptocurrency information using tools
connected to CryptoMind.

AVAILABLE INFORMATION SOURCES

1. Market tools
   - PostgreSQL market data
   - Quantitative crypto analytics

2. RAG tool
   - Crypto documentation
   - Protocol information
   - Research content stored in the knowledge base

3. News tool
   - Recent cryptocurrency news from RSS feeds
   - News from multiple crypto publications


============================================================
STRICT GROUNDING RULES
============================================================

1. When answering a question using the RAG tool,
   use ONLY information explicitly contained in
   the retrieved documents.

2. Do NOT use your general knowledge to add facts,
   explanations, examples, or details that are not
   present in the retrieved documents.

3. Do NOT expand a documented claim with outside
   knowledge.

4. If the retrieved documents mention staking but
   do not mention rewards, do not mention rewards.

5. If the retrieved documents mention validators but
   do not mention penalties or slashing, do not
   mention penalties or slashing.

6. Every factual claim based on RAG must be directly
   supported by the retrieved text.

7. When using RAG information, cite the source and
   chunk number.

8. If the retrieved documents do not contain enough
   information to answer the question, say:

   "The available documents do not contain enough
   information to answer this question."

9. Do not fill missing information using general
   knowledge.

10. Treat retrieved documents as the only source of
    truth for documentary questions.


============================================================
MARKET DATA RULES
============================================================

11. Use market tools whenever the user asks for
    quantitative cryptocurrency market information.

12. Never invent prices, returns, volatility,
    drawdown, Sharpe ratios, moving averages,
    or other market metrics.

13. Treat market tool results as the source of truth.


============================================================
NEWS RULES
============================================================

14. Use the news tool when the user asks for
    recent cryptocurrency news.

15. When the user asks about a specific cryptocurrency,
    pass its symbol to the news tool.

16. Use these symbols:

    Bitcoin  -> BTC
    Ethereum -> ETH
    Solana   -> SOL
    BNB      -> BNB

17. Only summarize news returned by the news tool.

18. Do not invent news events, facts, dates,
    prices, or details that are not present
    in the retrieved articles.

19. Clearly identify the news source when
    summarizing news.


============================================================
COMBINED QUESTIONS
============================================================

20. Use both market tools and the RAG tool when
    the question requires both market data and
    documentary information.

21. Use both market tools and the news tool when
    the question requires market data and recent news.

22. Clearly distinguish between:

    - Information from documents
    - Market data
    - News
    - Interpretation


============================================================
SAFETY
============================================================

23. Do not provide personalized investment advice.

24. Do not give buy, sell, or hold recommendations.


============================================================
STYLE
============================================================

25. Keep the final answer clear and concise.

26. Do not mention information that was not obtained
    from the appropriate CryptoMind tool.
"""


# ============================================================
# TOOL EXECUTION
# ============================================================

def execute_tool(
    tool_name,
    tool_args
):

    print(
        f"\nExecuting tool: {tool_name}"
    )

    print(
        f"Arguments: {tool_args}"
    )


    if tool_name == "get_crypto_analysis":

        result = get_crypto_analysis(
            tool_args["symbol"]
        )


    elif tool_name == "compare_crypto_assets":

        result = compare_crypto_assets(
            tool_args["symbols"]
        )


    elif tool_name == "search_crypto_documents":

        result = search_crypto_documents(
            tool_args["query"]
        )


    elif tool_name == "search_crypto_news":

        result = search_crypto_news(
            symbol=tool_args["symbol"],
            limit=tool_args.get(
                "limit",
                10
            )
        )


    else:

        result = {
            "error": (
                f"Unknown tool: {tool_name}"
            )
        }


    print(
        "\nTool result:"
    )

    print(
        result
    )

    return result


# ============================================================
# LLM NODE
# ============================================================

def llm_node(
    state: CryptoMindState
):

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


    assistant_message = {

        "role": "assistant",

        "content": message.content or ""

    }


    if message.tool_calls:

        assistant_message[
            "tool_calls"
        ] = []


        for tool_call in message.tool_calls:

            assistant_message[
                "tool_calls"
            ].append(

                {
                    "id": tool_call.id,

                    "type": "function",

                    "function": {

                        "name":
                        tool_call.function.name,

                        "arguments":
                        tool_call.function.arguments

                    }

                }

            )


    return {
        "messages": [
            assistant_message
        ]
    }


# ============================================================
# TOOL NODE
# ============================================================

def tool_node(
    state: CryptoMindState
):

    last_message = state[
        "messages"
    ][-1]


    tool_messages = []


    for tool_call in last_message[
        "tool_calls"
    ]:

        tool_call_id = tool_call[
            "id"
        ]


        function_data = tool_call[
            "function"
        ]


        tool_name = function_data[
            "name"
        ]


        tool_args = json.loads(
            function_data[
                "arguments"
            ]
        )


        result = execute_tool(

            tool_name,

            tool_args

        )


        tool_message = {

            "role": "tool",

            "tool_call_id":
            tool_call_id,

            "name":
            tool_name,

            "content":
            json.dumps(
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

def should_continue(
    state: CryptoMindState
):

    last_message = state[
        "messages"
    ][-1]


    if last_message.get(
        "tool_calls"
    ):

        return "tools"


    return END


# ============================================================
# BUILD LANGGRAPH
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


graph_builder.add_edge(
    START,
    "llm"
)


graph_builder.add_conditional_edges(

    "llm",

    should_continue,

    {
        "tools": "tools",
        END: END
    }

)


graph_builder.add_edge(
    "tools",
    "llm"
)


graph = graph_builder.compile()


# ============================================================
# TEST AGENT
# ============================================================

if __name__ == "__main__":

    initial_state: CryptoMindState = {

        "messages": [

            {

                "role": "user",

                "content": (
                    "Give me the latest Bitcoin news "
                    "and explain how Bitcoin has performed "
                    "over the last 30 days."
                )

            }

        ]

    }


    print(
        "\nStarting CryptoMind "
        "LangGraph Agent...\n"
    )


    result = graph.invoke(
        initial_state
    )


    print("\n")

    print(
        "=" * 60
    )

    print(
        "CRYPTOMIND AGENT RESULT"
    )

    print(
        "=" * 60
    )


    for message in result[
        "messages"
    ]:

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

            print(
                content
            )


        if message.get(
            "tool_calls"
        ):

            print(
                "\nTool Calls:"
            )


            for call in message[
                "tool_calls"
            ]:

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