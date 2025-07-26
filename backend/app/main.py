# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.upload import router as upload_router
from app.routes.auth import router as auth_router
from app.routes.protected import router as protected_router
from app.routes.chat import router as chat_router

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
# app.include_router(protected_router, prefix="/api/protected", tags=["Protected"])
app.include_router(upload_router, prefix="/api/upload", tags=["Upload PDF"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(chat_router, prefix="/api/chats", tags=["Chats"])


# app.include_router(ask_router, prefix="/ask", tags=["Ask Questions"])
# app.include_router(chat_router, prefix="/api/chat")

@app.get("/")
def read_root():
    return {"message": "Welcome to Chat with PDF backend!"}
