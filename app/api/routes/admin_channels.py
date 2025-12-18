from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from telethon.errors import RPCError

from app.api.deps import get_db
from app.core.config import settings
from app.core.security import require_admin
from app.crud.channels import get_channel, upsert_channel_from_telegram
from app.crud.tags import get_or_create_tags
from app.models.channel import Channel
from app.schemas.channel import ChannelCreateByLink, ChannelOut, ChannelUpdate
from app.services.telegram import TelegramService, normalize_telegram_url

router = APIRouter(
    prefix="/admin/channels",
    tags=["admin"],
    dependencies=[Depends(require_admin)],
)

telegram = TelegramService()


@router.get("/auth-check", status_code=status.HTTP_200_OK)
async def admin_auth_check() -> dict[str, str]:
    """
    Lightweight endpoint to validate the provided admin token.
    Because the router has a global dependency on require_admin,
    only a fully correct token will return 200 OK.
    """
    return {"status": "ok"}


@router.post("", response_model=ChannelOut, status_code=status.HTTP_201_CREATED)
async def add_channel(payload: ChannelCreateByLink, db: AsyncSession = Depends(get_db)):
    try:
        canonical_url, _ = normalize_telegram_url(payload.telegram_url)
        tags = await get_or_create_tags(db, payload.tags)
        tg = await telegram.fetch_channel(canonical_url, settings.media_dir)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RPCError as e:
        raise HTTPException(status_code=400, detail=f"Telegram RPC error: {type(e).__name__}")

    channel = await upsert_channel_from_telegram(
        session=db,
        telegram_url=tg.telegram_url,
        username=tg.username,
        title=tg.title,
        description=tg.description,
        subscriber_count=tg.subscriber_count,
        photo_path=tg.photo_path,
        tags=tags,
        visible_from=payload.visible_from,
        visible_to=payload.visible_to,
    )
    await db.commit()
    await db.refresh(channel)
    return channel


@router.patch("/{channel_id}", response_model=ChannelOut)
async def update_channel(channel_id: int, payload: ChannelUpdate, db: AsyncSession = Depends(get_db)):
    channel = await get_channel(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    if payload.title is not None:
        channel.title = payload.title
    if payload.description is not None:
        channel.description = payload.description
    if payload.subscriber_count is not None:
        channel.subscriber_count = payload.subscriber_count
    if payload.visible_from is not None:
        channel.visible_from = payload.visible_from
    if payload.visible_to is not None:
        channel.visible_to = payload.visible_to

    # Tags logic:
    # 1) If "tags" is provided -> full replace
    # 2) Else apply tags_add and tags_remove incrementally
    if payload.tags is not None:
        channel.tags = await get_or_create_tags(db, payload.tags)
    else:
        # add
        if payload.tags_add:
            to_add = await get_or_create_tags(db, payload.tags_add)
            existing_ids = {t.id for t in channel.tags}
            for t in to_add:
                if t.id not in existing_ids:
                    channel.tags.append(t)
                    existing_ids.add(t.id)

        # remove
        if payload.tags_remove:
            remove_norm = {n.strip().lower() for n in payload.tags_remove if n and n.strip()}
            if remove_norm:
                channel.tags = [t for t in channel.tags if t.name not in remove_norm]

    if not channel.tags:
        raise HTTPException(status_code=400, detail="Channel must have at least one tag")

    await db.commit()
    await db.refresh(channel)
    return channel


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_channel(channel_id: int, db: AsyncSession = Depends(get_db)):
    channel = await get_channel(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    await db.execute(delete(Channel).where(Channel.id == channel_id))
    await db.commit()
    return None
