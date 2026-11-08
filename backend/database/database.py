from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# "postgresql+psycopg://usuario:contraseña@host:puerto/nombre_base_de_datos"
SQLALCHEMY_DATABASE_URL = ""

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Obtener la sesión
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()