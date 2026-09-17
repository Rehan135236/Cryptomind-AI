from langchain_groq import ChatGroq
from langchain_core.tools import StructuredTool
from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
    ToolMessage
)

from .tools import (
    get_crypto_analysis,
    compare_crypto_assets
)


# ============================================================
# CryptoMind System Prompt
# ============================================================

SYSTEM_PROMPT = """
You are CryptoMind, an AI-powered cryptocurrency
research and analysis assistant.

Your job is to analyze cryptocurrency market data
using the tools provided by the application.

Rules:

1. Use the available tools whenever the user's
   question requires cryptocurrency market data.

2. Use get_crypto_analysis when the user asks about
   one specific cryptocurrency.

3. Use compare_crypto_assets when the user asks to
   compare multiple cryptocurrencies.

4. Never invent prices, returns, volatility,
   drawdowns, Sharpe ratios, market capitalization,
   trading volume, or any other numerical data.

5. Treat data returned by CryptoMind tools as the
   source of truth for market metrics.

6. Only discuss metrics that are actually returned
   by the tools.

7. Clearly distinguish between:
   - Data: numerical facts returned by the tools.
   - Interpretation: observations based only on those numbers.

8. Do not claim that an asset is the "best",
   "worst", "safest", "most attractive", or
   "best investment".

9. Do not provide personalized investment advice,
   trading instructions, or recommendations to
   buy, sell, or hold an asset.

10. Do not make predictions about future prices
    or future returns.

11. When comparing assets, describe the numerical
    differences without turning the comparison
    into an investment recommendation.

12. If requested cryptocurrency data is unavailable,
    clearly say so.

13. Be precise. Do not contradict the numerical
    data returned by the tools.

14. Keep answers concise but informative.
"""


# ============================================================
# Create LangChain tools
# ============================================================

crypto_analysis_tool = StructuredTool.from_function(
    func=get_crypto_analysis,
    description=(
        "Get detailed market analysis for one cryptocurrency. "
        "Use this when the user asks about a specific cryptocurrency."
    )
)


crypto_comparison_tool = StructuredTool.from_function(
    func=compare_crypto_assets,
    description=(
        "Compare multiple cryptocurrencies using market metrics. "
        "Use this when the user asks to compare cryptocurrencies."
    )
)


tools = [
    crypto_analysis_tool,
    crypto_comparison_tool
]


# ============================================================
# Create the LLM
# ============================================================

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0.2
)


# ============================================================
# Bind tools to the LLM
# ============================================================

llm_with_tools = llm.bind_tools(tools)


# ============================================================
# Tool lookup
# ============================================================

tool_map = {
    "get_crypto_analysis": crypto_analysis_tool,
    "compare_crypto_assets": crypto_comparison_tool
}


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":

    question = (
        "Compare BTC, ETH, SOL and BNB using the "
        "CryptoMind database. Compare their current "
        "prices, 7-day returns and 30-day returns."
    )


    # --------------------------------------------------------
    # Initial conversation
    # --------------------------------------------------------

    messages = [
        SystemMessage(
            content=SYSTEM_PROMPT
        ),
        HumanMessage(
            content=question
        )
    ]


    # --------------------------------------------------------
    # First LLM call
    # --------------------------------------------------------

    response = llm_with_tools.invoke(
        messages
    )


    print("\nLLM requested these tools:\n")

    print(response.tool_calls)


    # Add AI response
    messages.append(response)


    # --------------------------------------------------------
    # Execute tools
    # --------------------------------------------------------

    for tool_call in response.tool_calls:

        tool_name = tool_call["name"]

        tool_args = tool_call["args"]

        tool = tool_map.get(tool_name)


        if tool is None:

            result = {
                "error": "Unknown tool requested."
            }

        else:

            result = tool.invoke(
                tool_args
            )


        print("\nTool result:\n")

        print(result)


        # Add tool result to conversation
        messages.append(
            ToolMessage(
                content=str(result),
                tool_call_id=tool_call["id"]
            )
        )


    # --------------------------------------------------------
    # Final LLM call
    # --------------------------------------------------------

    final_response = llm_with_tools.invoke(
        messages
    )


    print("\nFinal CryptoMind AI Response:\n")

    print(final_response.content)