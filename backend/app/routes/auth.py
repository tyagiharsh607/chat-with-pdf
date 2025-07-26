from fastapi import APIRouter, HTTPException, Depends
from starlette.status import HTTP_400_BAD_REQUEST
from ..models.user import SignupRequest, LoginRequest, AuthResponse
from ..supabase_client import get_supabase
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest, supabase=Depends(get_supabase)):
    try:
        result = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password
        })
        logger.info(f"Signup attempt: {result}")
        print(f"Signup attempt: {result}")  # Debugging line

        if result.get("error"):
            logger.error(f"Signup error for {payload.email}: {result['error']['message']}")
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=result["error"]["message"])

        session = result.get("session")
        user = result.get("user")
        logger.info(f"User signedup successfuly: {user}")
        return AuthResponse(
            access_token=session["access_token"],
            refresh_token=session.get("refresh_token"),
            user_id=user["id"],
            email=user["email"]
        )
    except Exception as e:
        logger.exception(f"Unexpected error during signup for {payload.email}")
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, supabase=Depends(get_supabase)):
    try:
        logger.info(f"Login attempt for email: {payload.email}")
        result = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })

        if result.get("error"):
            logger.error(f"Login error for {payload.email}: {result['error']['message']}")
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=result["error"]["message"])

        session = result.get("session")
        user = result.get("user")
        logger.info(f"User signedup successfuly: {user}")
        return AuthResponse(
            access_token=session["access_token"],
            refresh_token=session.get("refresh_token"),
            user_id=user["id"],
            email=user["email"]
        )
    except Exception as e:
        logger.exception(f"Unexpected error during login for {payload.email}")
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=str(e))
