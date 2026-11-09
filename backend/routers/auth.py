
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
    OAuth2PasswordRequestForm
)
from sqlalchemy.orm import Session
from jwt.exceptions import InvalidTokenError

from database.database import get_db
from models import models
from schemas import schemas

from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

router = APIRouter()

# Configuración de autenticación
bearer_scheme = HTTPBearer(auto_error=False)


# REGISTRAR USUARIO
@router.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(
        (models.User.email == user.email) |
        (models.User.username == user.username)
    ).first()

    if db_user:
        raise HTTPException(
            status_code=400,
            detail="El correo o nombre de usuario ya está registrado"
        )

    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# INICIAR SESIÓN
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = db.query(models.User).filter(
        models.User.email == form_data.username
    ).first()

    if not db_user or not verify_password(
        form_data.password, db_user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    access_token = create_access_token(
        data={"sub": str(db_user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# OBTENER USUARIO AUTENTICADO MEDIANTE JWT
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=401,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"}
    )

    if credentials is None:
        raise credentials_exception

    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (InvalidTokenError, ValueError, AttributeError):
        raise credentials_exception

    current_user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if current_user is None:
        raise credentials_exception

    return current_user


# CONSULTAR USUARIO ACTUAL
@router.get("/users/me", response_model=schemas.UserResponse)
def get_my_user(current_user: models.User = Depends(get_current_user)):
    return current_user
