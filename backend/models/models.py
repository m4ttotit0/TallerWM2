from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database.database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Relación con la entidad principal
    items = relationship("PrincipalEntity", back_populates="owner")


class PrincipalEntity(Base):
    __tablename__ = "principal_entities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Llave foránea que lo conecta con el usuario
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="items")