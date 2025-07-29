# auth_middleware.py
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR
from app.supabase_client import get_supabase
import logging

security = HTTPBearer()
logger = logging.getLogger(__name__)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    supabase = Depends(get_supabase)
):
    """
    Verify JWT token with Supabase and return current user
    """
    try:
        token = credentials.credentials
        
        # Use Supabase to verify the token
        user_response = supabase.auth.get_user(token)
        
        if user_response.user is None:
            logger.warning("Invalid token provided")
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        
        user = user_response.user
        
        # Return user data in the format your app expects
        return {
            "user_id": user.id,
            "email": user.email,
            "created_at": user.created_at,
            "last_sign_in_at": user.last_sign_in_at,
            "email_verified": user.email_confirmed_at is not None,
            "user": user  # Full user object if needed elsewhere
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )
