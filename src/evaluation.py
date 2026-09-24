from .graph import graph


TEST_CASES = [
    {
        "name": "Current Bitcoin price",
        "query": (
            "What is the current Bitcoin price and "
            "what is its 24-hour change?"
        )
    },
    {
        "name": "Historical Bitcoin performance",
        "query": (
            "How did Bitcoin perform over the actual "
            "historical period available in the database?"
        )
    },
    {
        "name": "Bitcoin risk analysis",
        "query": (
            "What are Bitcoin's volatility, maximum drawdown, "
            "and daily Sharpe-like ratio?"
        )
    },
    {
        "name": "Latest Bitcoin news",
        "query": (
            "Give me the latest Bitcoin news."
        )
    },
    {
        "name": "Ethereum document question",
        "query": (
            "According to the available documents, "
            "how does Ethereum secure its network?"
        )
    },
    {
        "name": "Unknown document question",
        "query": (
            "According to the available documents, "
            "who founded Ethereum?"
        )
    },
    {
        "name": "Crypto comparison",
        "query": (
            "Compare Bitcoin, Ethereum, Solana, and BNB "
            "using the available historical data."
        )
    },
]


def get_final_answer(result):
    """
    Extract the final human-readable answer
    from the LangGraph result.
    """

    final_report = result.get("final_report")

    if final_report:
        return final_report

    messages = result.get("messages", [])

    for message in reversed(messages):

        if isinstance(message, dict):
            role = message.get("role")
            content = message.get("content")

            if role == "assistant" and content:
                return content

        elif hasattr(message, "content"):
            content = message.content

            if content:
                return content

    return "No final answer found."


def run_evaluation():

    print("\n" + "=" * 70)
    print("CRYPTOMIND AGENT EVALUATION")
    print("=" * 70)

    results = []

    for number, test in enumerate(
        TEST_CASES,
        start=1
    ):

        print("\n" + "-" * 70)
        print(
            f"TEST {number}: "
            f"{test['name']}"
        )
        print("-" * 70)

        print("\nQuery:")
        print(test["query"])

        try:

            result = graph.invoke(
                {
                    "messages": [
                        {
                            "role": "user",
                            "content": test["query"]
                        }
                    ]
                }
            )

            final_answer = get_final_answer(result)

            print("\nAgent response:")
            print(final_answer)

            results.append(
                {
                    "test": test["name"],
                    "status": "PASSED",
                    "answer": final_answer
                }
            )

        except Exception as error:

            print("\nERROR:")
            print(error)

            results.append(
                {
                    "test": test["name"],
                    "status": "FAILED",
                    "answer": str(error)
                }
            )

    print("\n" + "=" * 70)
    print("EVALUATION SUMMARY")
    print("=" * 70)

    total = len(results)

    passed = sum(
        1
        for result in results
        if result["status"] == "PASSED"
    )

    failed = total - passed

    print(f"\nTotal tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    print("\nTest results:")

    for result in results:

        print(
            f"- {result['status']}: "
            f"{result['test']}"
        )

    print("\n" + "=" * 70)


if __name__ == "__main__":
    run_evaluation()