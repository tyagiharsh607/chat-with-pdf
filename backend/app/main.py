# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.upload import router as upload_router
# from app.routes.ask import ask_router

app = FastAPI(
    title="Chat with PDF",
    description="RAG-powered PDF chatbot using HuggingFace + Qdrant + Gemini",
    version="1.0.0"
)

# CORS setup (adjust for production later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your routers
app.include_router(upload_router, prefix="/api/upload", tags=["Upload PDF"])
# app.include_router(ask_router, prefix="/ask", tags=["Ask Questions"])
# app.include_router(chat_router, prefix="/api/chat")
# app.include_router(auth_router, prefix="/api/auth")

@app.get("/")
def read_root():
    return {"message": "Welcome to Chat with PDF backend!"}
