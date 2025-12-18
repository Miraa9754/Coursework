import re
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime, timezone

from telethon import TelegramClient
from telethon.errors import RPCError
from telethon.tl.functions.channels import GetFullChannelRequest

from app.core.config import settings


@dataclass
class TelegramChannelData:
    telegram_url: str
    username: str | None
    title: str
    description: str | None
    subscriber_count: int | None
    photo_path: str | None


_USERNAME_RE = re.compile(r"^(?:https?://)?t\.me/(?P<u>[A-Za-z0-9_]{4,})/?$")


def normalize_telegram_url(raw: str) -> tuple[str, str]:
    raw = raw.strip()
    m = _USERNAME_RE.match(raw)
    if not m:
        raise ValueError("Only public t.me/<username> links are supported for MVP")
    username = m.group("u")
    return f"https://t.me/{username}", username


class TelegramService:
    def __init__(self) -> None:
        self._client: TelegramClient | None = None

    async def start(self) -> None:
        session_name = settings.telegram_session_name
        self._client = TelegramClient(session_name, settings.telegram_api_id, settings.telegram_api_hash)
        await self._client.connect()

        if settings.telegram_bot_token:
            await self._client.start(bot_token=settings.telegram_bot_token)
        else:
            # Якщо bot token порожній, Telethon працює з user-session.
            # Авторизація відбудеться при першому запуску через стандартний flow Telethon.
            await self._client.start()

    async def stop(self) -> None:
        if self._client:
            await self._client.disconnect()
            self._client = None

    async def fetch_channel(self, telegram_url: str, media_dir: str) -> TelegramChannelData:
        if not self._client:
            raise RuntimeError("Telegram client is not started")

        canonical_url, username = normalize_telegram_url(telegram_url)

        entity = await self._client.get_entity(username)

        title = getattr(entity, "title", username)
        about: str | None = None
        participants_count: int | None = None

        try:
            full = await self._client(GetFullChannelRequest(entity))
            about = getattr(full.full_chat, "about", None)
            participants_count = getattr(full.full_chat, "participants_count", None)
        except RPCError:
            about = None
            participants_count = None

        photo_path: str | None = None
        try:
            out_dir = Path(media_dir) / "channels" / username
            out_dir.mkdir(parents=True, exist_ok=True)
            downloaded = await self._client.download_profile_photo(entity, file=str(out_dir / "avatar"))
            if downloaded:
                photo_path = str(Path(downloaded).as_posix())
        except Exception:
            photo_path = None

        return TelegramChannelData(
            telegram_url=canonical_url,
            username=username,
            title=title,
            description=about,
            subscriber_count=participants_count,
            photo_path=photo_path,
        )
