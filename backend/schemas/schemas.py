from pydantic import BaseModel, ConfigDict

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str
<<<<<<< HEAD
=======

>>>>>>> e1b0659e34213d719bdc4dde6a15efd456f83feb
class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)

class PrincipalEntityCreate(BaseModel):
    title: str
    description: str | None = None