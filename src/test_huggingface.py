import os
from dotenv import load_dotenv
from huggingface_hub import whoami

load_dotenv()

token = os.getenv("HF_TOKEN")

if not token:
    print("HF_TOKEN not found in .env")
    raise SystemExit

try:
    user = whoami(token=token)

    print("Hugging Face authentication successful!")
    print("Username:", user["name"])

except Exception as e:
    print("Hugging Face authentication failed.")
    print("Error:", e)