from app.db.session import engine
from app.db.base import Base

# імпорт моделей потрібен для реєстрації metadata
from app.models.channel import Channel  # noqa: F401
from app.models.tag import Tag  # noqa: F401


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
