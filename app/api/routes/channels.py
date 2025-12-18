from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.crud.channels import get_channel, list_channels_public
from app.schemas.channel import ChannelOut

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get("", response_model=list[ChannelOut])
async def list_channels(
    tags: list[str] | None = Query(default=None),
    match: str = Query(default="any", pattern="^(any|all)$"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await list_channels_public(db, tags, match, limit, offset)


@router.get("/{channel_id}", response_model=ChannelOut)
async def channel_details(channel_id: int, db: AsyncSession = Depends(get_db)):
    channel = await get_channel(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channel


@router.get("/{channel_id}/go")
async def go_to_channel(channel_id: int, db: AsyncSession = Depends(get_db)):
    channel = await get_channel(db, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return RedirectResponse(url=channel.telegram_url, status_code=307)
