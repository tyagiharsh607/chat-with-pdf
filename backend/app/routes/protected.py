from fastapi import APIRouter, Depends
from ..middlewares.auth_middleware import get_current_user

router = APIRouter()

@router.get("/")
def protected_route(current_user=Depends(get_current_user)):
    return {"message": "Hello, authenticated user!", "user": current_user}
