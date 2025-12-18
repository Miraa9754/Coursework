from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.tag import TagOut
from app.schemas.common import ORMBase


class ChannelOut(ORMBase):
    id: int
    telegram_url: str
    username: str | None
    title: str
    description: str | None
    subscriber_count: int | None
    photo_path: str | None
    visible_from: datetime | None
    visible_to: datetime | None
    last_fetched_at: datetime | None
    tags: list[TagOut]



class ChannelCreateByLink(BaseModel):
    telegram_url: str = Field(min_length=5, max_length=255)
    tags: list[str] = Field(min_length=1)
    visible_from: datetime | None = None
    visible_to: datetime | None = None


class ChannelUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    subscriber_count: int | None = None
    visible_from: datetime | None = None
    visible_to: datetime | None = None
    # Повна заміна (старий режим)
    tags: list[str] | None = None
    # Інкрементальні зміни (новий режим)
    tags_add: list[str] | None = None
    tags_remove: list[str] | None = None
