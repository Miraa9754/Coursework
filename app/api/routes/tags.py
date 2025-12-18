from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.tag import Tag
from app.schemas.tag import TagOut, TagCreate
from app.crud.tags import delete_tag, create_tag
from app.core.security import require_admin  # <--- ІМПОРТ

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
async def list_tags(db: AsyncSession = Depends(get_db)) -> list[Tag]:
    # Цей ендпоінт залишається публічним
    return (await db.execute(select(Tag).order_by(Tag.name.asc()))).scalars().all()


@router.delete(
    "/{tag_id}", 
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_tag_by_id(
    tag_id: int,
    admin_check: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
) -> None:
    deleted_tag = await delete_tag(db, tag_id=tag_id)
    
    if deleted_tag is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag with id {tag_id} not found"
        )
    
    return


@router.post(
    "",
    response_model=TagOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_tag_admin(
    payload: TagCreate,
    admin_check: None = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> Tag:
    try:
        return await create_tag(db, payload.name)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc