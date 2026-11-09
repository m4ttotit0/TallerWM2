
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine
from models import models
from routers import auth, items
from fastapi.middleware.cors import CORSMiddleware

# Crear las tablas al iniciar
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Taller 2",
    description="Backend con FastAPI y SQLAlchemy",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar los routers
app.include_router(auth.router)
app.include_router(items.router)


@app.get("/")
def read_root():
    return {
        "message": "¡Servidor de FastAPI funcionando correctamente!"
    }
