from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tag import Tag


def _normalize(name: str) -> str:
    return name.strip().lower()


async def get_or_create_tags(session: AsyncSession, names: list[str]) -> list[Tag]:
    normalized = [_normalize(n) for n in names if n and n.strip()]
    seen: set[str] = set()
    normalized = [n for n in normalized if not (n in seen or seen.add(n))]

    if not normalized:
        raise ValueError("At least one tag is required")

    existing = (await session.execute(select(Tag).where(Tag.name.in_(normalized)))).scalars().all()
    existing_map = {t.name: t for t in existing}

    result: list[Tag] = []
    for name in normalized:
        tag = existing_map.get(name)
        if not tag:
            tag = Tag(name=name)
            session.add(tag)
            result.append(tag)
        else:
            result.append(tag)

    return result

async def delete_tag(session: AsyncSession, tag_id: int) -> Tag | None:
    statement = select(Tag).where(Tag.id == tag_id)
    tag = (await session.execute(statement)).scalars().first()
    
    if tag:
        # Видаляємо тег
        await session.delete(tag)
        # Фіксуємо транзакцію для виконання видалення
        await session.commit()
        return tag
    
    return None


async def create_tag(session: AsyncSession, name: str) -> Tag:
    normalized = _normalize(name)
    if not normalized:
        raise ValueError("Tag name cannot be empty")

    existing = (await session.execute(select(Tag).where(Tag.name == normalized))).scalars().first()
    if existing:
        return existing

    tag = Tag(name=normalized)
    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return tag