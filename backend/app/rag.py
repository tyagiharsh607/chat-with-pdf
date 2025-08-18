from typing import List
from app.embeddings import model  # your embedding model instance (e.g., SentenceTransformer)
from app.qdrant_client import qdrant, COLLECTION_NAME  # your Qdrant client and collection name
from qdrant_client.http.models import Filter, FieldCondition, MatchValue
import google.generativeai as genai
import time

import os

from dotenv import load_dotenv
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not set in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

# Create model instance
gemini_model = genai.GenerativeModel("gemini-2.5-flash")

def generate_assistant_response(query: str, chat_id: str, top_k: int = 5) -> str:
    """
    Given a user query and chat_id, perform vector retrieval of relevant chunks
    and then generate the assistant's response using Gemini model via Vertex AI.
    """
    
    
    filter_obj = Filter(
        must=[
            FieldCondition(
                key="chat_id",
                match=MatchValue(value=chat_id)
            )
        ]
    )
    
    # Step 1: Embed the query (list of one item)
    query_vector = model.encode([query])[0]
    
    # Step 2: Search nearest chunks in Qdrant with retry logic
    max_retries = 3
    retry_delay = 1  # seconds
    search_result = None
    
    for attempt in range(max_retries):
        try:
            print(f"Attempting Qdrant search (attempt {attempt + 1}/{max_retries})")
            
            search_result = qdrant.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                query_filter=filter_obj,
                limit=top_k,
            )
            
            print(f"✅ Qdrant search successful on attempt {attempt + 1}")
            break  # Success - exit retry loop
            
        except Exception as e:
            if attempt == max_retries - 1:  # Last attempt failed
                print(f"❌ Qdrant search failed after {max_retries} attempts: {e}")
                return "I'm having trouble accessing the document right now. Please try again in a moment."
            else:
                print(f"⚠️ Qdrant search attempt {attempt + 1} failed: {e}")
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
    
    # Step 3: Extract text payloads of found chunks
    chunks_texts: List[str] = [hit.payload.get("text", "") for hit in search_result if hit.payload]
    
    if not chunks_texts:
        return "I couldn't find relevant information in the uploaded file to answer that."
    
    print(f"Found {len(chunks_texts)} relevant chunks for chat_id {chat_id}.")
    print(f"Chunks texts: {chunks_texts}")
    
    # Step 4: Build context prompt
    context = "\n\n".join(chunks_texts)
    prompt_text = (
        "You are a helpful assistant. Use the following context to answer the question.\n"
        f"Context:\n{context}\n\n"
        f"Question: {query}\nAnswer:"
    )
    
    # Step 5: Call the Gemini Model for text generation
    return call_gemini_text_generation(prompt_text)


def call_gemini_text_generation(prompt: str) -> str:
    """
    Calls Google Gemini API to generate text given a prompt.
    Returns the generated text or an error message.
    """
    try:
        # Send prompt to Gemini
        response = gemini_model.generate_content(prompt)

        # Parse the response
        if response.candidates and response.candidates[0].content.parts:
            print(f"Gemini response: {response.candidates[0].content.parts[0].text.strip()}")
            return response.candidates[0].content.parts[0].text.strip()
        else:
            return "[EMPTY_RESPONSE] No valid text returned by Gemini."

    except Exception as e:
        error_message = str(e)
        if "429" in error_message and "quota" in error_message.lower():
            return "[RATE_LIMITED] Gemini API quota exceeded. Try again later."
        return f"[ERROR] {error_message}"
