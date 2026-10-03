import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from src.document_loader import (
    load_documents_from_directory,
    split_documents,
)
from src.ingest_documents import ingest_documents


class TestRagIngestionArchitecture(unittest.TestCase):

    def test_01_ethereum_txt_discovered(self):
        docs = load_documents_from_directory("data/documents")
        sources = [d["source"] for d in docs]
        self.assertIn("ethereum.txt", sources)
        eth_doc = next(d for d in docs if d["source"] == "ethereum.txt")
        self.assertIn("Ethereum", eth_doc["text"])
        self.assertEqual(eth_doc["source"], "ethereum.txt")

    def test_02_multiple_txt_files_discovered(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            f1 = Path(tmpdir) / "coin1.txt"
            f2 = Path(tmpdir) / "coin2.txt"
            f1.write_text("Coin 1 document content.", encoding="utf-8")
            f2.write_text("Coin 2 document content.", encoding="utf-8")

            docs = load_documents_from_directory(tmpdir)
            sources = [d["source"] for d in docs]
            self.assertEqual(len(docs), 2)
            self.assertIn("coin1.txt", sources)
            self.assertIn("coin2.txt", sources)

    def test_03_source_metadata_preserved_in_chunks(self):
        docs = [
            {"source": "test_token.txt", "text": "Token line 1. " * 50, "path": "/path/test_token.txt"}
        ]
        chunks = split_documents(docs, chunk_size=100, chunk_overlap=10)
        self.assertGreater(len(chunks), 1)
        for chunk in chunks:
            self.assertEqual(chunk["source"], "test_token.txt")
            self.assertIn("chunk_id", chunk)
            self.assertIn("text", chunk)

    def test_04_chunking_behavior(self):
        text = "Word " * 200
        docs = [{"source": "sample.txt", "text": text, "path": "/path/sample.txt"}]
        chunks = split_documents(docs, chunk_size=200, chunk_overlap=20)
        self.assertGreater(len(chunks), 1)
        self.assertEqual(chunks[0]["chunk_id"], 1)
        self.assertEqual(chunks[1]["chunk_id"], 2)

    def test_05_empty_directory_handled(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            docs = load_documents_from_directory(tmpdir)
            self.assertEqual(docs, [])

            res = ingest_documents(tmpdir)
            self.assertEqual(res["status"], "empty")
            self.assertEqual(res["vectors_upserted"], 0)

    def test_06_deterministic_vector_ids_and_idempotency(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            doc_path = Path(tmpdir) / "sample_crypto.txt"
            doc_path.write_text("Sample text content for vector id test. " * 20, encoding="utf-8")

            # Mock HF Client and Pinecone Index to test vector payload creation and deterministic IDs
            mock_hf_client = MagicMock()
            mock_hf_client.feature_extraction.return_value = [0.1] * 384

            mock_pinecone_index = MagicMock()

            with patch("src.ingest_documents.get_hf_client", return_value=mock_hf_client), \
                 patch("src.ingest_documents.get_pinecone_index", return_value=mock_pinecone_index):

                res1 = ingest_documents(tmpdir)
                self.assertEqual(res1["status"], "success")

                # Verify upsert call structure
                self.assertEqual(mock_pinecone_index.upsert.call_count, 1)
                upsert_vectors = mock_pinecone_index.upsert.call_args[1]["vectors"]
                self.assertGreater(len(upsert_vectors), 0)

                first_vector_id = upsert_vectors[0]["id"]
                self.assertEqual(first_vector_id, "sample_crypto.txt:chunk:1")
                self.assertEqual(upsert_vectors[0]["metadata"]["source"], "sample_crypto.txt")

                # Re-ingest same document
                res2 = ingest_documents(tmpdir)
                self.assertEqual(res2["status"], "success")
                self.assertEqual(mock_pinecone_index.upsert.call_count, 2)
                upsert_vectors_2 = mock_pinecone_index.upsert.call_args_list[1][1]["vectors"]
                
                # Deterministic IDs must be identical
                self.assertEqual(upsert_vectors[0]["id"], upsert_vectors_2[0]["id"])

    def test_07_bitcoin_txt_discovered_and_retrieved(self):
        from src.tools import search_crypto_documents

        docs = load_documents_from_directory("data/documents")
        sources = [d["source"] for d in docs]
        self.assertIn("bitcoin.txt", sources)
        btc_doc = next(d for d in docs if d["source"] == "bitcoin.txt")
        self.assertIn("Bitcoin", btc_doc["text"])

        # Test live RAG retrieval for Bitcoin
        results = search_crypto_documents("What is Bitcoin?", top_k=3)
        self.assertGreater(len(results), 0)
        top_match = results[0]
        self.assertEqual(top_match["source"], "bitcoin.txt")
        self.assertIn("chunk_id", top_match)
        self.assertGreater(top_match["score"], 0.5)

    def test_08_all_16_tracked_assets_discovered_and_retrieved(self):
        from src.tools import search_crypto_documents

        docs = load_documents_from_directory("data/documents")
        sources = [d["source"] for d in docs]
        self.assertEqual(len(docs), 16, f"Expected 16 documents, found {len(docs)}")

        asset_queries = [
            ("binancecoin.txt", "What is BNB?"),
            ("solana.txt", "What is Solana?"),
            ("xrp.txt", "What is XRP?"),
            ("cardano.txt", "What is Cardano?"),
            ("dogecoin.txt", "What is Dogecoin?"),
            ("avalanche.txt", "What is Avalanche?"),
            ("tron.txt", "What is TRON?"),
            ("chainlink.txt", "What is Chainlink?"),
            ("polkadot.txt", "What is Polkadot?"),
            ("litecoin.txt", "What is Litecoin?"),
            ("bitcoin-cash.txt", "What is Bitcoin Cash?"),
            ("uniswap.txt", "What is Uniswap?"),
            ("cosmos.txt", "What is Cosmos?"),
            ("near.txt", "What is NEAR Protocol?"),
        ]

        for expected_file, query in asset_queries:
            self.assertIn(expected_file, sources)
            results = search_crypto_documents(query, top_k=1)
            self.assertGreater(len(results), 0, f"No results for query '{query}'")
            top_match = results[0]
            self.assertEqual(
                top_match["source"],
                expected_file,
                f"Query '{query}' matched '{top_match['source']}' instead of '{expected_file}'"
            )
            self.assertGreater(top_match["score"], 0.5)


if __name__ == "__main__":
    unittest.main()
