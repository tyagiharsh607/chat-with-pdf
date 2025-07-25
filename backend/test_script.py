import requests
import os
from dotenv import load_dotenv
import subprocess

load_dotenv()

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

cmd = [
    "curl",
    "-X", "GET",
    f"{QDRANT_URL}/collections",
    "-H", f"api-key: {QDRANT_API_KEY}"
]

output = subprocess.check_output(cmd)
print(output.decode())