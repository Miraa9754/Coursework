from datetime import datetime, timezone
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.channel import Channel
from app.models.tag import Tag, channel_tags


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _is_visible_predicate():
    n = now_utc()
    return and_(
        or_(Channel.visible_from.is_(None), Channel.visible_from <= n),
        or_(Channel.visible_to.is_(None), Channel.visible_to >= n),
    )


async def get_channel(session: AsyncSession, channel_id: int) -> Channel | None:
    q = select(Channel).options(selectinload(Channel.tags)).where(Channel.id == channel_id)
    return (await session.execute(q)).scalars().first()

async def get_channel_by_url(session: AsyncSession, telegram_url: str) -> Channel | None:
    q = select(Channel).options(selectinload(Channel.tags)).where(Channel.telegram_url == telegram_url)
    return (await session.execute(q)).scalars().first()


async def list_channels_public(
    session: AsyncSession,
    tag_names: list[str] | None,
    match: str,
    limit: int,
    offset: int,
) -> list[Channel]:
    q = (
        select(Channel)
        .options(selectinload(Channel.tags))
        .where(_is_visible_predicate())
        .order_by(Channel.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    if tag_names:
        norm = [t.strip().lower() for t in tag_names if t and t.strip()]
        if norm:
            if match == "all":
                sub = (
                    select(channel_tags.c.channel_id)
                    .join(Tag, Tag.id == channel_tags.c.tag_id)
                    .where(Tag.name.in_(norm))
                    .group_by(channel_tags.c.channel_id)
                    .having(func.count(func.distinct(Tag.name)) == len(set(norm)))
                    .subquery()
                )
                q = q.where(Channel.id.in_(select(sub.c.channel_id)))
            else:
                q = q.join(channel_tags).join(Tag).where(Tag.name.in_(norm)).distinct()

    return (await session.execute(q)).scalars().all()


async def upsert_channel_from_telegram(
    session: AsyncSession,
    telegram_url: str,
    username: str | None,
    title: str,
    description: str | None,
    subscriber_count: int | None,
    photo_path: str | None,
    tags: list[Tag],
    visible_from,
    visible_to,
) -> Channel:
    channel = await get_channel_by_url(session, telegram_url)
    if not channel:
        channel = Channel(
            telegram_url=telegram_url,
            username=username,
            title=title,
            description=description,
            subscriber_count=subscriber_count,
            photo_path=photo_path,
            visible_from=visible_from,
            visible_to=visible_to,
            last_fetched_at=now_utc(),
        )
        channel.tags = tags
        session.add(channel)
        return channel

    channel.username = username
    channel.title = title
    channel.description = description
    channel.subscriber_count = subscriber_count
    channel.photo_path = photo_path
    channel.visible_from = visible_from
    channel.visible_to = visible_to
    channel.last_fetched_at = now_utc()
    channel.tags = tags
    return channel
