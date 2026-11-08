from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import engine, Base, get_db
from models import models
from schemas import schemas

# Crea las tablas al iniciar
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Taller 2",
    description="Backend con FastAPI y SQLAlchemy",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "¡Servidor de FastAPI funcionando correctamente!"}

# Ejemplo para user
@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=user.password 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user