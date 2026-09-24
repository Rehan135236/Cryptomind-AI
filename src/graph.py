import json
import operator
import os
import time

from typing import Annotated, TypedDict

from dotenv import load_dotenv
from groq import Groq

from langgraph.graph import (
    StateGraph,
    START,
    END
)

from .tools import (
    get_crypto_analysis,
    get_live_crypto_price,
    compare_crypto_assets,
    search_crypto_documents,
    search_crypto_news
)

from .research_report import (
    CryptoResearchReport
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)

if not GROQ_API_KEY:

    raise ValueError(
        "GROQ_API_KEY is not set in .env"
    )


# ============================================================
# GROQ CLIENT
# ============================================================

client = Groq(
    api_key=GROQ_API_KEY
)

MODEL = "openai/gpt-oss-120b"


# ============================================================
# STATE
# ============================================================

class CryptoMindState(TypedDict):

    messages: Annotated[
        list[dict],
        operator.add
    ]

    report: dict

    final_report: str


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are CryptoMind, an AI cryptocurrency
research assistant.

Your job is to research cryptocurrency assets
using the available tools.

Available tools:

1. get_live_crypto_price
   - Retrieves the current live cryptocurrency
     price
   - Includes the current USD price
   - Includes the 24-hour percentage change
   - Uses CoinGecko live market data

2. get_crypto_analysis
   - Retrieves historical quantitative market
     metrics from PostgreSQL
   - Includes historical price information,
     moving averages, returns, daily volatility,
     maximum drawdown and daily Sharpe-like ratio

3. compare_crypto_assets
   - Compares multiple cryptocurrencies
     using quantitative market metrics

4. search_crypto_documents
   - Searches the CryptoMind document
     knowledge base using RAG

5. search_crypto_news
   - Retrieves recent cryptocurrency news
   - Can filter news by cryptocurrency symbol

Research rules:

1. Use get_live_crypto_price whenever the user
   asks for the current, live, or real-time
   cryptocurrency price.

2. Use get_crypto_analysis when the user asks
   about historical performance or quantitative
   market metrics.

3. Use both get_live_crypto_price and
   get_crypto_analysis when the user asks for
   the current price AND historical performance.

4. Do not treat the historical PostgreSQL
   current_price as the current live price when
   live market data is available.

5. Use search_crypto_news when the user asks
   for recent or latest cryptocurrency news.

6. Use search_crypto_documents when the user asks
   about information contained in the CryptoMind
   knowledge base.

7. Use compare_crypto_assets when comparing
   multiple cryptocurrencies.

8. Use multiple tools when necessary.

9. Do not invent market data.

10. Do not invent news.

11. Do not invent information from documents.

12. Use the cryptocurrency symbol provided
    by the user.

13. Do not provide investment advice.

14. Do not make predictions about future prices.

15. Clearly distinguish current live data,
    historical data, news and document information.

16. Treat return_period as the return over the
    actual period represented by the database
    observations. Do not automatically call it
    a 30-day return.

17. Treat daily_volatility as the standard
    deviation of daily returns expressed as
    a percentage. It is not annualized volatility.

18. Treat daily_sharpe_ratio as an unannualized
    daily Sharpe-like ratio. Do not describe it
    as a conventional annualized Sharpe ratio.

19. After collecting enough information,
    stop calling tools and allow the report
    generation stage to create the final report.
"""


# ============================================================
# REPORT GENERATION PROMPT
# ============================================================

REPORT_GENERATION_PROMPT = """
You are the final report writer for CryptoMind.

Generate a professional cryptocurrency
research report using ONLY the validated
structured report provided below.

IMPORTANT:

The structured report contains two different
types of market information.

1. live_market

This comes from the CoinGecko live market API.

It represents the current live cryptocurrency
price and current 24-hour percentage change.

2. market_snapshot

This comes from historical PostgreSQL
analytics.

It represents the historical dataset and
calculated metrics.

Do NOT confuse these two sources.

Do NOT introduce information that is not
contained in the structured report.

Do NOT change numerical values.

Do NOT recalculate numerical values.

Do NOT invent missing information.

Do NOT create causes or explanations that
are not supported by the supplied data.

Do NOT make investment recommendations.

Do NOT make future price predictions.

Clearly distinguish factual information from
interpretation.

For live market data:

- Clearly identify it as live/current data.
- Mention the source when available.
- Include the 24-hour change when available.

For historical market data:

- Clearly identify it as historical/database data.
- Do not describe the historical database
  current_price as the live price.
- Clearly state the actual observation period
  when period_start, period_end and period_days
  are available.
- Describe return_period as the return over the
  actual database observation period.
- Do not automatically call return_period a
  "30-day return".

For moving averages:

- Clearly state that the 7-day and 30-day
  moving averages are calculated from the
  historical database.
- If comparing them with the live price,
  explicitly say "current live price" and
  "historical moving average".
- Do not imply that the moving averages are
  live values.

For risk metrics:

- daily_volatility is the standard deviation
  of daily returns expressed as a percentage.
- Do NOT call daily_volatility annualized
  volatility.
- Do NOT describe daily_volatility as
  "low", "moderate", "high", "safe" or
  "risky" unless the supplied data explicitly
  supports such a comparison.
- daily_sharpe_ratio is an unannualized
  daily Sharpe-like ratio.
- Do NOT describe it as a conventional
  annualized Sharpe ratio.
- maximum_drawdown represents the largest
  observed decline from a previous running
  peak within the historical dataset.

For news:

- Use only the supplied news articles.
- Do not invent article details.
- Do not claim that an article proves something
  unless the supplied description supports it.
- If news is missing, explicitly state that
  no news was provided.

For document context:

- Use only the supplied retrieved documents.
- Mention the source and chunk when available.

Use this structure:

1. CRYPTOCURRENCY RESEARCH REPORT

Asset: <asset>

2. LIVE MARKET DATA

Include:

- Current live price
- 24-hour change
- CoinGecko coin ID if available
- Source

3. HISTORICAL MARKET SNAPSHOT

Include:

- Historical database current price
- Average price
- Minimum price
- Maximum price
- 7-day moving average
- 30-day moving average

4. PERFORMANCE

Include:

- 7-day return
- Actual database observation-period return
- Observation period start
- Observation period end
- Number of days represented by the observations

Do not label the observation-period return as
a 30-day return unless the supplied period is
actually 30 days.

5. RISK METRICS

Include:

- Daily volatility
- Maximum drawdown
- Daily Sharpe-like ratio

Use the exact terminology above.

6. LATEST NEWS

List the supplied news articles.

For each article include:

- Source
- Title
- Publication date if available
- Short description
- Link if available

7. DOCUMENT CONTEXT

Summarize supplied document information.

Mention:

- Source
- Chunk number
- Relevant information

8. EVIDENCE AND SOURCES

Explain what information came from:

- Live market data
- Historical market data
- News
- Documents
- Comparisons

9. INTERPRETATION

Provide a concise interpretation ONLY when
supported by the supplied data.

You may compare live and historical values.

For example, it is acceptable to state that
the current live price is above or below a
historical moving average if the supplied
numbers support that statement.

However, do not imply that a difference between
live data and historical data is an error.

Do not characterize daily volatility as
low/moderate/high without an explicit
comparison basis.

Do not characterize the daily Sharpe-like ratio
as good/bad or strong/weak.

News articles may mention market events such
as selling pressure, liquidations, interest
rates, options expirations or ETF activity.

Report these as reported events only.

Do not claim that a news event caused a price
movement unless the supplied article explicitly
establishes that causal relationship.

Use cautious wording such as:

"The supplied news reports mention..."

"The article describes..."

"The available information does not establish
whether this event caused the price movement."

Do not give investment advice.

Do not make future price predictions.

If information is missing, say so clearly.
"""


# ============================================================
# TOOL DEFINITIONS
# ============================================================

TOOLS = [

    # --------------------------------------------------------
    # HISTORICAL MARKET ANALYSIS
    # --------------------------------------------------------

    {
        "type": "function",

        "function": {

            "name": "get_crypto_analysis",

            "description": (
                "Retrieve historical quantitative "
                "market analysis for a cryptocurrency "
                "from the CryptoMind PostgreSQL database."
            ),

            "parameters": {

                "type": "object",

                "properties": {

                    "symbol": {
                        "type": "string",

                        "description": (
                            "Cryptocurrency symbol, "
                            "for example BTC, ETH, "
                            "SOL or BNB."
                        )
                    }

                },

                "required": [
                    "symbol"
                ]
            }
        }
    },


    # --------------------------------------------------------
    # LIVE MARKET PRICE
    # --------------------------------------------------------

    {
        "type": "function",

        "function": {

            "name": "get_live_crypto_price",

            "description": (
                "Retrieve the current live market "
                "price and 24-hour percentage change "
                "for a cryptocurrency using CoinGecko."
            ),

            "parameters": {

                "type": "object",

                "properties": {

                    "symbol": {
                        "type": "string",

                        "description": (
                            "Cryptocurrency symbol such "
                            "as BTC, ETH, SOL, BNB or XRP."
                        )
                    }

                },

                "required": [
                    "symbol"
                ]
            }
        }
    },


    # --------------------------------------------------------
    # CRYPTO COMPARISON
    # --------------------------------------------------------

    {
        "type": "function",

        "function": {

            "name": "compare_crypto_assets",

            "description": (
                "Compare multiple cryptocurrencies "
                "using historical quantitative "
                "market metrics."
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
                            "List of cryptocurrency "
                            "symbols to compare."
                        )
                    }
                },

                "required": [
                    "symbols"
                ]
            }
        }
    },


    # --------------------------------------------------------
    # RAG DOCUMENT SEARCH
    # --------------------------------------------------------

    {
        "type": "function",

        "function": {

            "name": "search_crypto_documents",

            "description": (
                "Search the CryptoMind RAG "
                "knowledge base for cryptocurrency "
                "information."
            ),

            "parameters": {

                "type": "object",

                "properties": {

                    "query": {

                        "type": "string",

                        "description": (
                            "Question or search query."
                        )
                    },

                    "top_k": {

                        "type": "integer",

                        "description": (
                            "Number of relevant "
                            "document chunks to retrieve."
                        ),

                        "default": 3
                    }
                },

                "required": [
                    "query"
                ]
            }
        }
    },


    # --------------------------------------------------------
    # CRYPTO NEWS
    # --------------------------------------------------------

    {
        "type": "function",

        "function": {

            "name": "search_crypto_news",

            "description": (
                "Retrieve recent cryptocurrency "
                "news. Optionally filter by "
                "cryptocurrency symbol."
            ),

            "parameters": {

                "type": "object",

                "properties": {

                    "symbol": {

                        "type": "string",

                        "description": (
                            "Cryptocurrency symbol "
                            "such as BTC, ETH, SOL "
                            "or BNB."
                        )
                    },

                    "limit": {

                        "type": "integer",

                        "description": (
                            "Maximum number of "
                            "articles to retrieve."
                        ),

                        "default": 10
                    }
                },

                "required": []
            }
        }
    }
]


# ============================================================
# TOOL EXECUTION
# ============================================================

def execute_tool(
    tool_name,
    arguments
):

    if tool_name == "get_crypto_analysis":

        return get_crypto_analysis(
            arguments["symbol"]
        )

    elif tool_name == "get_live_crypto_price":

        return get_live_crypto_price(
            arguments["symbol"]
        )

    elif tool_name == "compare_crypto_assets":

        return compare_crypto_assets(
            arguments["symbols"]
        )

    elif tool_name == "search_crypto_documents":

        return search_crypto_documents(
            query=arguments["query"],
            top_k=arguments.get(
                "top_k",
                3
            )
        )

    elif tool_name == "search_crypto_news":

        return search_crypto_news(
            symbol=arguments.get(
                "symbol"
            ),
            limit=arguments.get(
                "limit",
                10
            )
        )

    return {
        "error": (
            f"Unknown tool: {tool_name}"
        )
    }


# ============================================================
# LLM NODE
# ============================================================

def llm_node(
    state: CryptoMindState
):

    response = client.chat.completions.create(

        model=MODEL,

        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            }
        ] + state["messages"],

        tools=TOOLS,

        tool_choice="auto",

        temperature=0.2
    )

    message = response.choices[0].message

    assistant_message = {

        "role": "assistant",

        "content": message.content
    }

    if message.tool_calls:

        assistant_message[
            "tool_calls"
        ] = []

        for tool_call in message.tool_calls:

            assistant_message[
                "tool_calls"
            ].append({

                "id":
                    tool_call.id,

                "type":
                    "function",

                "function": {

                    "name":
                        tool_call.function.name,

                    "arguments":
                        tool_call.function.arguments
                }
            })

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

    tool_messages = []

    existing_report = (
        state.get("report")
        or {}
    )

    report_data = {

        "asset":
            existing_report.get(
                "asset",
                ""
            ),

        "live_market":
            dict(
                existing_report.get(
                    "live_market",
                    {}
                )
            ),

        "market_snapshot":
            dict(
                existing_report.get(
                    "market_snapshot",
                    {}
                )
            ),

        "performance":
            dict(
                existing_report.get(
                    "performance",
                    {}
                )
            ),

        "risk_metrics":
            dict(
                existing_report.get(
                    "risk_metrics",
                    {}
                )
            ),

        "news":
            list(
                existing_report.get(
                    "news",
                    []
                )
            ),

        "document_context":
            list(
                existing_report.get(
                    "document_context",
                    []
                )
            ),

        "sources":
            list(
                existing_report.get(
                    "sources",
                    []
                )
            ),

        "interpretation":
            existing_report.get(
                "interpretation"
            )
    }

    last_message = state[
        "messages"
    ][-1]

    tool_calls = last_message.get(
        "tool_calls",
        []
    )

    for tool_call in tool_calls:

        tool_name = (
            tool_call[
                "function"
            ][
                "name"
            ]
        )

        arguments = json.loads(
            tool_call[
                "function"
            ][
                "arguments"
            ]
        )

        print(
            f"\nExecuting tool: {tool_name}"
        )

        print(
            f"Arguments: {arguments}"
        )

        result = execute_tool(
            tool_name,
            arguments
        )

        print(
            "\nTool result:"
        )

        print(
            result
        )


        # ====================================================
        # HISTORICAL MARKET ANALYSIS
        # ====================================================

        if tool_name == "get_crypto_analysis":

            if (
                isinstance(
                    result,
                    dict
                )
                and
                "error" not in result
            ):

                report_data[
                    "asset"
                ] = result.get(
                    "symbol",
                    ""
                )

                report_data[
                    "market_snapshot"
                ] = {

                    "current_price":
                        result.get(
                            "current_price"
                        ),

                    "average_price":
                        result.get(
                            "average_price"
                        ),

                    "minimum_price":
                        result.get(
                            "minimum_price"
                        ),

                    "maximum_price":
                        result.get(
                            "maximum_price"
                        ),

                    "moving_average_7d":
                        result.get(
                            "moving_average_7d"
                        ),

                    "moving_average_30d":
                        result.get(
                            "moving_average_30d"
                        )
                }

                report_data[
                    "performance"
                ] = {

                    "return_7d":
                        result.get(
                            "return_7d"
                        ),

                    "return_period":
                        result.get(
                            "return_period"
                        ),

                    "period_start":
                        result.get(
                            "period_start"
                        ),

                    "period_end":
                        result.get(
                            "period_end"
                        ),

                    "period_days":
                        result.get(
                            "period_days"
                        )
                }

                report_data[
                    "risk_metrics"
                ] = {

                    "daily_volatility":
                        result.get(
                            "daily_volatility"
                        ),

                    "maximum_drawdown":
                        result.get(
                            "maximum_drawdown"
                        ),

                    "daily_sharpe_ratio":
                        result.get(
                            "daily_sharpe_ratio"
                        )
                }

                report_data[
                    "sources"
                ].append({

                    "source_type":
                        "historical_market_data",

                    "source_name":
                        "PostgreSQL / CryptoMind analytics",

                    "description":
                        (
                            "Historical cryptocurrency "
                            "market metrics calculated "
                            "from the PostgreSQL database."
                        )
                })


        # ====================================================
        # LIVE MARKET PRICE
        # ====================================================

        elif tool_name == "get_live_crypto_price":

            if (
                isinstance(
                    result,
                    dict
                )
                and
                "error" not in result
            ):

                report_data[
                    "asset"
                ] = result.get(
                    "symbol",
                    report_data.get(
                        "asset",
                        ""
                    )
                )

                report_data[
                    "live_market"
                ] = {

                    "current_price":
                        result.get(
                            "current_price"
                        ),

                    "change_24h":
                        result.get(
                            "change_24h"
                        ),

                    "coin_id":
                        result.get(
                            "coin_id"
                        ),

                    "source":
                        result.get(
                            "source"
                        )
                }

                report_data[
                    "sources"
                ].append({

                    "source_type":
                        "live_market_data",

                    "source_name":
                        "CoinGecko",

                    "description":
                        (
                            "Current live "
                            "cryptocurrency market "
                            "price and 24-hour change."
                        )
                })


        # ====================================================
        # NEWS
        # ====================================================

        elif tool_name == "search_crypto_news":

            if isinstance(
                result,
                list
            ):

                report_data[
                    "news"
                ].extend(
                    result
                )

                report_data[
                    "sources"
                ].append({

                    "source_type":
                        "news",

                    "source_name":
                        "Crypto RSS feeds",

                    "description":
                        (
                            "Recent cryptocurrency "
                            "news retrieved from "
                            "RSS feeds."
                        )
                })


        # ====================================================
        # RAG DOCUMENTS
        # ====================================================

        elif tool_name == "search_crypto_documents":

            if isinstance(
                result,
                list
            ):

                report_data[
                    "document_context"
                ].extend(
                    result
                )

                report_data[
                    "sources"
                ].append({

                    "source_type":
                        "document",

                    "source_name":
                        (
                            "CryptoMind document "
                            "knowledge base"
                        ),

                    "description":
                        (
                            "Retrieved information "
                            "from the CryptoMind "
                            "RAG knowledge base."
                        )
                })


        # ====================================================
        # CRYPTO COMPARISON
        # ====================================================

        elif tool_name == "compare_crypto_assets":

            if isinstance(
                result,
                list
            ):

                report_data[
                    "document_context"
                ].append({

                    "comparison_data":
                        result
                })

                report_data[
                    "sources"
                ].append({

                    "source_type":
                        "market_comparison",

                    "source_name":
                        (
                            "PostgreSQL / "
                            "CryptoMind analytics"
                        ),

                    "description":
                        (
                            "Comparative cryptocurrency "
                            "market metrics."
                        )
                })


        # ====================================================
        # TOOL MESSAGE
        # ====================================================

        tool_messages.append({

            "role":
                "tool",

            "tool_call_id":
                tool_call["id"],

            "content":
                json.dumps(
                    result,
                    default=str
                )
        })


    # ========================================================
    # DEDUPLICATE NEWS
    # ========================================================

    unique_news = []

    seen_news = set()

    for article in report_data[
        "news"
    ]:

        if not isinstance(
            article,
            dict
        ):

            continue

        key = (

            article.get(
                "source"
            ),

            article.get(
                "title"
            ),

            article.get(
                "link"
            )
        )

        if key not in seen_news:

            seen_news.add(
                key
            )

            unique_news.append(
                article
            )

    report_data[
        "news"
    ] = unique_news


    # ========================================================
    # DEDUPLICATE SOURCES
    # ========================================================

    unique_sources = []

    seen_sources = set()

    for source in report_data[
        "sources"
    ]:

        if not isinstance(
            source,
            dict
        ):

            continue

        key = (

            source.get(
                "source_type"
            ),

            source.get(
                "source_name"
            )
        )

        if key not in seen_sources:

            seen_sources.add(
                key
            )

            unique_sources.append(
                source
            )

    report_data[
        "sources"
    ] = unique_sources


    # ========================================================
    # RETURN
    # ========================================================

    return {

        "messages":
            tool_messages,

        "report":
            report_data
    }


# ============================================================
# DECIDE WHETHER TO CONTINUE
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

    return "report"


# ============================================================
# STRUCTURED REPORT VALIDATION
# ============================================================

def report_node(
    state: CryptoMindState
):

    print(
        "\nValidating structured "
        "research report..."
    )

    raw_report = (
        state.get("report")
        or {}
    )


    # ========================================================
    # VALIDATE LIVE MARKET DATA
    # ========================================================

    raw_live_market = raw_report.get(
        "live_market",
        {}
    )

    validated_live_market = {

        "current_price":
            raw_live_market.get(
                "current_price"
            ),

        "change_24h":
            raw_live_market.get(
                "change_24h"
            ),

        "coin_id":
            raw_live_market.get(
                "coin_id"
            ),

        "source":
            raw_live_market.get(
                "source"
            )
    }


    # ========================================================
    # VALIDATE NEWS
    # ========================================================

    validated_news = []

    for article in raw_report.get(
        "news",
        []
    ):

        if not isinstance(
            article,
            dict
        ):

            continue

        validated_news.append({

            "source":
                str(
                    article.get(
                        "source",
                        "Unknown"
                    )
                ),

            "title":
                str(
                    article.get(
                        "title",
                        ""
                    )
                ),

            "published":
                article.get(
                    "published"
                ),

            "description":
                article.get(
                    "description"
                ),

            "link":
                article.get(
                    "link"
                )
        })


    # ========================================================
    # VALIDATE DOCUMENTS
    # ========================================================

    validated_documents = []

    for document in raw_report.get(
        "document_context",
        []
    ):

        if isinstance(
            document,
            dict
        ):

            validated_documents.append(
                document
            )


    # ========================================================
    # VALIDATE SOURCES
    # ========================================================

    validated_sources = []

    seen_sources = set()

    for source in raw_report.get(
        "sources",
        []
    ):

        if not isinstance(
            source,
            dict
        ):

            continue

        source_type = str(
            source.get(
                "source_type",
                "unknown"
            )
        )

        source_name = str(
            source.get(
                "source_name",
                "Unknown"
            )
        )

        description = str(
            source.get(
                "description",
                ""
            )
        )

        key = (

            source_type,

            source_name
        )

        if key in seen_sources:

            continue

        seen_sources.add(
            key
        )

        validated_sources.append({

            "source_type":
                source_type,

            "source_name":
                source_name,

            "description":
                description
        })


    # ========================================================
    # CREATE PYDANTIC REPORT
    # ========================================================

    structured_report = CryptoResearchReport(

        asset=raw_report.get(
            "asset",
            ""
        ),

        live_market=
            validated_live_market,

        market_snapshot=
            raw_report.get(
                "market_snapshot",
                {}
            ),

        performance=
            raw_report.get(
                "performance",
                {}
            ),

        risk_metrics=
            raw_report.get(
                "risk_metrics",
                {}
            ),

        news=
            validated_news,

        document_context=
            validated_documents,

        sources=
            validated_sources,

        interpretation=
            raw_report.get(
                "interpretation"
            )
    )


    print(
        "Structured report "
        "validated successfully!"
    )


    return {

        "report":
            structured_report.model_dump()
    }


# ============================================================
# FINAL REPORT GENERATION
# ============================================================

def report_generation_node(
    state: CryptoMindState
):

    print(
        "\nGenerating final "
        "human-readable report..."
    )

    structured_report = state[
        "report"
    ]

    response = None

    for attempt in range(3):

        try:

            response = client.chat.completions.create(

                model=MODEL,

                messages=[

                    {
                        "role":
                            "system",

                        "content":
                            REPORT_GENERATION_PROMPT
                    },

                    {
                        "role":
                            "user",

                        "content":
                            json.dumps(
                                structured_report,
                                indent=2,
                                default=str
                            )
                    }

                ],

                temperature=0.1
            )

            break

        except Exception as error:

            error_message = str(error).lower()

            if (
                "429" not in error_message
                and "rate limit" not in error_message
            ):
                raise

            if attempt == 2:
                raise

            wait_time = 6 * (attempt + 1)

            print(
                f"\nGroq rate limit reached. "
                f"Retrying in {wait_time} seconds..."
            )

            time.sleep(wait_time)

    final_report = (
        response
        .choices[0]
        .message
        .content
    )

    return {

        "final_report":
            final_report
    }


# ============================================================
# BUILD LANGGRAPH
# ============================================================

builder = StateGraph(
    CryptoMindState
)

builder.add_node(
    "llm",
    llm_node
)

builder.add_node(
    "tools",
    tool_node
)

builder.add_node(
    "report",
    report_node
)

builder.add_node(
    "report_generation",
    report_generation_node
)

# ============================================================
# GRAPH EDGES
# ============================================================

builder.add_edge(
    START,
    "llm"
)

builder.add_conditional_edges(

    "llm",

    should_continue,

    {

        "tools":
            "tools",

        "report":
            "report"
    }
)

builder.add_edge(
    "tools",
    "llm"
)

builder.add_edge(
    "report",
    "report_generation"
)

builder.add_edge(
    "report_generation",
    END
)


# ============================================================
# COMPILE GRAPH
# ============================================================

graph = builder.compile()


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    query = (
        "Give me the current Bitcoin price, "
        "explain how Bitcoin has performed "
        "over the actual historical period "
        "available in the database, and give "
        "me the latest Bitcoin news."
    )

    print(
        "\n"
        + "=" * 70
    )

    print(
        "CRYPTOMIND AI RESEARCH AGENT"
    )

    print(
        "=" * 70
    )

    print(
        f"\nUser Query:\n{query}"
    )

    print(
        "\nRunning research agent..."
    )

    initial_state = {

        "messages": [

            {

                "role":
                    "user",

                "content":
                    query
            }
        ],

        "report":
            {},

        "final_report":
            ""
    }

    result = graph.invoke(
        initial_state
    )

    print(
        "\n"
        + "=" * 70
    )

    print(
        "FINAL RESEARCH REPORT"
    )

    print(
        "=" * 70
    )

    print(
        "\n"
        + result.get(
            "final_report",
            "No final report generated."
        )
    )

    print(
        "\n"
        + "=" * 70
    )

    print(
        "STRUCTURED REPORT"
    )

    print(
        "=" * 70
    )

    print(
        json.dumps(
            result.get(
                "report",
                {}
            ),
            indent=2,
            default=str
        )
    )

