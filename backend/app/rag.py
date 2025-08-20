from typing import List
from app.embeddings import model  # your embedding model instance (e.g., SentenceTransformer)
from app.qdrant_client import qdrant, COLLECTION_NAME  # your Qdrant client and collection name
from app.supabase_client import supabase  # ✅ Add Supabase import for message history
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
    and then generate the assistant's response using Gemini model with conversation context.
    """
    
    # ✅ Step 1: Get recent conversation history
    try:

        recent_messages = supabase.table("messages")\
            .select("role, content")\
            .eq("chat_id", chat_id)\
            .order("created_at")\
            .limit(10)\
            .execute()
        
        # Build conversation context (exclude the current message)
        conversation_history = ""
        if recent_messages.data and len(recent_messages.data) > 1:
            for msg in recent_messages.data:  # Exclude the last message (current user message)
                conversation_history += f"{msg['role']}: {msg['content']}\n"

            
    except Exception as e:

        conversation_history = ""
    
    # ✅ Step 2: Vector search with retry logic (unchanged)
    filter_obj = Filter(
        must=[
            FieldCondition(
                key="chat_id",
                match=MatchValue(value=chat_id)
            )
        ]
    )
    
    # Step 2a: Embed the query (list of one item)
    query_vector = model.encode([query])[0]
    
    # Step 2b: Search nearest chunks in Qdrant with retry logic
    max_retries = 3
    retry_delay = 1  # seconds
    search_result = None
    
    for attempt in range(max_retries):
        try:

            
            search_result = qdrant.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                query_filter=filter_obj,
                limit=top_k,
            )
            

            break  # Success - exit retry loop
            
        except Exception as e:
            if attempt == max_retries - 1:  # Last attempt failed

                return "I'm having trouble accessing the document right now. Please try again in a moment."
            else:


                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
    
    # Step 3: Extract text payloads of found chunks
    chunks_texts: List[str] = [hit.payload.get("text", "") for hit in search_result if hit.payload]
    
    if not chunks_texts:
        # ✅ Even without document context, use conversation history
        if conversation_history:
            prompt_text = (
                "You are a helpful assistant. Based on our previous conversation, answer the user's question.\n"
                f"Conversation History:\n{conversation_history}\n\n"
                f"Current Question: {query}\nAnswer:"
            )
            return call_gemini_text_generation(prompt_text)
        else:
            return "I couldn't find relevant information in the uploaded file to answer that."
    


    
    # ✅ Step 4: Build enhanced context prompt with conversation history
    document_context = "\n\n".join(chunks_texts)
    
    if conversation_history.strip():
        prompt_text = (
            "You are a helpful assistant. Use the following document context and our conversation history to provide a comprehensive answer.\n\n"
            f"Document Context:\n{document_context}\n\n"
            f"Conversation History:\n{conversation_history}\n\n"
            f"Current Question: {query}\n\n"
            "Instructions:\n"
            "- Reference previous parts of our conversation when relevant\n"
            "- Build upon previous answers if the question is a follow-up\n"
            "- Use the document context as your primary source of information\n"
            "- If the question relates to something we discussed before, acknowledge that connection\n\n"
            "Answer:"
        )

    else:
        # Fallback to original prompt if no conversation history
        prompt_text = (
            "You are a helpful assistant. Use the following context to answer the question.\n"
            f"Context:\n{document_context}\n\n"
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
        
        # ✅ Handle the nested RepeatedComposite structure
        if hasattr(response, 'candidates') and response.candidates:
            candidate = response.candidates[0]
            
            if hasattr(candidate, 'content') and candidate.content:
                content = candidate.content
                
                if hasattr(content, 'parts') and content.parts:
                    parts = content.parts
                    
                    # ✅ Handle RepeatedComposite parts structure
                    if len(parts) > 0:
                        first_part = parts
                        
                        # Check if first_part is still RepeatedComposite
                        if hasattr(first_part, '__iter__') and not isinstance(first_part, str):
                            # It's still a repeated composite, get the first element
                            try:
                                actual_part = next(iter(first_part))
                                if hasattr(actual_part, 'text'):
                                    generated_text = actual_part.text.strip()

                                    return generated_text
                            except (StopIteration, TypeError):
                                pass
                        
                        # ✅ Try direct text access
                        if hasattr(first_part, 'text'):
                            generated_text = first_part.text.strip()

                            return generated_text
                        
                        # ✅ Try alternative attribute names
                        for attr in ['text', 'content', 'value']:
                            if hasattr(first_part, attr):
                                text_value = getattr(first_part, attr)
                                if isinstance(text_value, str) and text_value.strip():

                                    return text_value.strip()
        
        return "[EMPTY_RESPONSE] No valid text returned by Gemini."

    except Exception as e:
        error_message = str(e)

        
        if "429" in error_message and "quota" in error_message.lower():
            return "[RATE_LIMITED] Gemini API quota exceeded. Try again later."
        return f"[ERROR] {error_message}"
