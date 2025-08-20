from fastapi import APIRouter, HTTPException, Depends
from starlette.status import HTTP_400_BAD_REQUEST
from app.models.user import SignupRequest, LoginRequest, AuthResponse, RefreshTokenRequest
from app.supabase_client import get_supabase
from app.middlewares.auth_middleware import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


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


        # Check for user in result (object, not dict!)
        if result.user is None:
            # Try to get an error attribute, else generic
            error_message = getattr(result, "error", None)
            if error_message:
                # If error has a message field, use it
                error_message = getattr(result.error, "message", str(result.error))
            else:
                error_message = "Signup failed"
            logger.error(f"Signup failed for {payload.email}: {error_message}")
            raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=error_message)

        session = result.session
        user = result.user

        logger.info(f"User signed up successfully: {user}")


        # Handle email confirmation required case
        if session is None:
            logger.info(f"User created but email confirmation required for {payload.email}")
            return AuthResponse(
                access_token=None,  # No token yet
                refresh_token=None,  # No token yet
                user_id=user.id,
                email=user.email,
                message="Please check your email to confirm your account.", 
                requires_confirmation=True
            )

        # Normal signup with immediate session (if email confirmation is disabled)
        return AuthResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user_id=user.id,
            email=user.email,
            message="Signup successful",
            requires_confirmation=False
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like the user creation failure above)
        raise
    except Exception as e:
        logger.exception(f"Unexpected error during signup for {payload.email}")
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=f"Signup failed: {str(e)}")

@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, supabase=Depends(get_supabase)):
    try:
        logger.info(f"Login attempt for email: {payload.email}")
        result = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })

        logger.info(f"Login attempt result: {result}")


        # Check if user exists (using attribute access, not dictionary)
        if result.user is None:
            logger.error(f"Login failed for {payload.email}: Invalid credentials")
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST, 
                detail="Invalid email or password"
            )

        # Check if session exists
        if result.session is None:
            logger.error(f"Login failed for {payload.email}: No session created")
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST, 
                detail="Login failed - please try again"
            )

        session = result.session
        user = result.user
        
        logger.info(f"User logged in successfully: {user.email}")


        return AuthResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user_id=user.id,
            email=user.email,
            message="Login successful",
            requires_confirmation=False
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (like the credential failures above)
        raise
    except Exception as e:
        logger.exception(f"Unexpected error during login for {payload.email}")
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail=f"Login failed: {str(e)}")


@router.get("/profile")
async def get_profile(current_user = Depends(get_current_user)):
    """
    Get current user profile using access token
    """
    try:
        logger.info(f"Profile request for user: {current_user['user_id']}")
        
        return {
            "user_id": current_user["user_id"],
            "email": current_user["email"],
            "created_at": str(current_user["created_at"]) if current_user.get("created_at") else None,
            "email_verified": current_user.get("email_verified", True),  # Assuming verified since they logged in
            "last_sign_in": str(current_user.get("last_sign_in_at")) if current_user.get("last_sign_in_at") else None
        }
        
    except Exception as e:
        logger.exception(f"Error fetching profile for user: {current_user.get('user_id', 'unknown')}")
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile"
        )




@router.post("/refresh-token")
async def refresh_access_token(request: RefreshTokenRequest, supabase=Depends(get_supabase)):
    """
    Refresh access token using refresh token
    """
    try:
        logger.info("Token refresh request received")

        
        # Use Supabase Python client to refresh the session
        result = supabase.auth.refresh_session(request.refresh_token)  # ✅ Use request.refresh_token

        
        if result.session is None:
            logger.error("Failed to refresh session - invalid refresh token")
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        session = result.session
        user = result.user
        
        logger.info(f"Token refreshed successfully for user: {user.email}")
        
        return AuthResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,  # New refresh token
            user_id=user.id,
            email=user.email,
            message="Token refreshed successfully",
            requires_confirmation=False
        )
        
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed"
        )
