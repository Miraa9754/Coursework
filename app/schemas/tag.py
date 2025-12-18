from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.common import ORMBase


class TagOut(ORMBase):
    id: int
    name: str



class TagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)
