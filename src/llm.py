import os
import json

from dotenv import load_dotenv
from groq import Groq

from .tools import (
    get_crypto_analysis,
    compare_crypto_assets
)


load_dotenv()


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


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
   drawdowns, Sharpe ratios, or other numerical data.

5. Treat data returned by CryptoMind tools as the
   source of truth for market metrics.

6. Clearly distinguish between:
   - Data: numerical facts returned by the tools.
   - Interpretation: observations based on those numbers.

7. Do not provide personalized investment advice,
   trading instructions, or recommendations to buy,
   sell, or hold an asset.

8. You may explain what the metrics mean and describe
   observable trends.

9. If requested cryptocurrency data is unavailable,
   clearly say so.

10. Keep answers concise but informative.
"""


def ask_llm(question):

    tools = [

        {
            "type": "function",
            "function": {
                "name": "get_crypto_analysis",
                "description": (
                    "Get detailed market analysis for "
                    "one cryptocurrency from the CryptoMind "
                    "PostgreSQL database."
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
                    "market metrics stored in the CryptoMind "
                    "PostgreSQL database."
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
                                "such as BTC, ETH, SOL, and BNB."
                            )
                        }
                    },
                    "required": ["symbols"]
                }
            }
        }

    ]

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": question
        }
    ]

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=messages,
        tools=tools,
        tool_choice="auto",
        temperature=0.2
    )

    message = response.choices[0].message

    # Check whether the model wants to use a tool
    if message.tool_calls:

        messages.append(message)

        for tool_call in message.tool_calls:

            function_name = tool_call.function.name

            arguments = json.loads(
                tool_call.function.arguments
            )

            # Tool 1
            if function_name == "get_crypto_analysis":

                result = get_crypto_analysis(
                    arguments["symbol"]
                )

            # Tool 2
            elif function_name == "compare_crypto_assets":

                result = compare_crypto_assets(
                    arguments["symbols"]
                )

            else:

                result = {
                    "error": "Unknown tool requested."
                }

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result)
                }
            )

        # Give the tool results back to the LLM
        final_response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=messages,
            tools=tools,
            temperature=0.2
        )

        return final_response.choices[0].message.content

    return message.content


if __name__ == "__main__":

    question = (
        "Compare BTC, ETH, SOL and BNB using the "
        "CryptoMind database. Compare their current "
        "prices, 7-day returns, 30-day returns, "
        "volatility, maximum drawdown and Sharpe ratios."
    )

    answer = ask_llm(question)

    print("\nCryptoMind AI Response:\n")
    print(answer)