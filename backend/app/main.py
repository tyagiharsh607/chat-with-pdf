# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.upload import router as upload_router
from app.routes.auth import router as auth_router
from app.routes.chat import router as chat_router
from app.routes.message import router as message_router
import os
from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL")
print(f"Frontend URL: {FRONTEND_URL}")

app = FastAPI(
    title="ChatPDF",
    description="RAG-powered PDF chatbot using HuggingFace + Qdrant + Gemini",
    version="1.0.0"
)

# CORS setup (adjust for production later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(upload_router, prefix="/api/upload", tags=["Upload PDF"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/chats", tags=["Chats"])
app.include_router(message_router, prefix="/api/messages", tags=["Messages"])


# app.include_router(ask_router, prefix="/ask", tags=["Ask Questions"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Chat with PDF backend!"}
