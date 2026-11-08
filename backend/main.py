
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jwt.exceptions import InvalidTokenError

from database.database import engine, Base, get_db
from models import models
from schemas import schemas

from security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

# Crear las tablas al iniciar
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Taller 2",
    description="Backend con FastAPI y SQLAlchemy",
    version="1.0.0"
)

# Configuración de autenticación
bearer_scheme = HTTPBearer(auto_error=False)


@app.get("/")
def read_root():
    return {"message": "¡Servidor de FastAPI funcionando correctamente!"}


@app.post("/users/", response_model=schemas.UserResponse)
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


@app.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not db_user or not verify_password(
        user.password, db_user.hashed_password
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


# Obtener el usuario autenticado mediante JWT
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


@app.get("/users/me", response_model=schemas.UserResponse)
def get_my_user(current_user: models.User = Depends(get_current_user)):
    return current_user


# CREAR
@app.post("/items/")
def create_item(
    item: schemas.PrincipalEntityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    new_item = models.PrincipalEntity(
        title=item.title,
        description=item.description,
        user_id=current_user.id
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


# LISTAR LOS ITEMS DEL USUARIO
@app.get("/items/")
def get_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    return db.query(models.PrincipalEntity).filter(
        models.PrincipalEntity.user_id == current_user.id
    ).all()


# CONSULTAR UN ITEM
@app.get("/items/{item_id}")
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    item = db.query(models.PrincipalEntity).filter(
        models.PrincipalEntity.id == item_id,
        models.PrincipalEntity.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Elemento no encontrado"
        )

    return item


# MODIFICAR
@app.put("/items/{item_id}")
def update_item(
    item_id: int,
    item_data: schemas.PrincipalEntityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    item = db.query(models.PrincipalEntity).filter(
        models.PrincipalEntity.id == item_id,
        models.PrincipalEntity.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Elemento no encontrado"
        )

    item.title = item_data.title
    item.description = item_data.description

    db.commit()
    db.refresh(item)

    return item


# ELIMINAR
@app.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    item = db.query(models.PrincipalEntity).filter(
        models.PrincipalEntity.id == item_id,
        models.PrincipalEntity.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Elemento no encontrado"
        )

    db.delete(item)
    db.commit()

    return {"message": "Elemento eliminado correctamente"}
