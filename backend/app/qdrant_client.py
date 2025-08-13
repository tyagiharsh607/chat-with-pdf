from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, CollectionStatus, PayloadSchemaType

import os
from dotenv import load_dotenv

load_dotenv()


QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = "text_chunks"


qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)



def ensure_collection_exists():
    existing = qdrant.get_collections()
    print("existing", existing)
    if COLLECTION_NAME not in [col.name for col in existing.collections]:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=384,  # Must match your embedding model output
                distance=Distance.COSINE
            )
        )
        print(f"Collection '{COLLECTION_NAME}' created.")


# Create payload index on chat_id field for filtering
def ensure_payload_index():
    try:
        qdrant.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="chat_id",
            field_schema=PayloadSchemaType.KEYWORD,  
        )
        print("Payload index on 'chat_id' created.")
    except Exception as e:
        print(f"Payload index creation failed or already exists: {e}")

