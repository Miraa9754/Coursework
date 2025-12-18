from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Timestamped(ORMBase):
    created_at: datetime | None = None
    updated_at: datetime | None = None
