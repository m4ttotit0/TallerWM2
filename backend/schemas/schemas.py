from pydantic import BaseModel, ConfigDict

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)

class PrincipalEntityCreate(BaseModel):
    image_url: str
    description: str | None = None


class PrincipalEntityResponse(BaseModel):
    id: int
    image_url: str
    description: str | None = None
    user_id: int

    model_config = ConfigDict(from_attributes=True)