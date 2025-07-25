from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, CollectionStatus

import os
from dotenv import load_dotenv

load_dotenv()


QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "text_chunks"

print("QDRANT_URL", QDRANT_URL)
print("QDRANT_API_KEY", QDRANT_API_KEY)

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)



def ensure_collection_exists():
    existing = client.get_collections()
    print("existing", existing)
    if COLLECTION_NAME not in [col.name for col in existing.collections]:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=384,  # Must match your embedding model output
                distance=Distance.COSINE
            )
        )
