
from fastapi import FastAPI

from database.database import engine
from models import models
from routers import auth, items

# Crear las tablas al iniciar
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Taller 2",
    description="Backend con FastAPI y SQLAlchemy",
    version="1.0.0"
)

# Registrar los routers
app.include_router(auth.router)
app.include_router(items.router)


@app.get("/")
def read_root():
    return {
        "message": "¡Servidor de FastAPI funcionando correctamente!"
    }
