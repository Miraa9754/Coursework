from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware # <--- Імпорт

from app.core.config import settings
from app.db.init_db import init_db
from app.api.routes.channels import router as channels_router
from app.api.routes.tags import router as tags_router
from app.api.routes.admin_channels import router as admin_channels_router, telegram as telegram_service

# 1. СТВОРЕННЯ ЗАСТОСУНКУ
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await telegram_service.start()
    yield
    await telegram_service.stop()

app = FastAPI(title=settings.project_name, lifespan=lifespan) # <--- Створюємо 'app' тут

# 2. КОНФІГУРАЦІЯ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # ДОЗВОЛЯЄМО ВСІ ДЖЕРЕЛА
    allow_credentials=True,
    allow_methods=["*"],    # Дозволяє GET, POST, PATCH, DELETE
    allow_headers=["*"],    # Дозволяє X-Admin-Token
)

# 3. ПІДКЛЮЧЕННЯ РОУТЕРІВ
app.include_router(channels_router, prefix=settings.api_v1_prefix) 
app.include_router(tags_router, prefix=settings.api_v1_prefix)
app.include_router(admin_channels_router, prefix=settings.api_v1_prefix)

# 4. ОБСЛУГОВУВАННЯ МЕДІА
# Зверніть увагу, що у вашій версії цей рядок закоментований. 
# [cite_start]Якщо вам потрібне відображення аватарів (див. п. 8 інструкції)[cite: 45], розкоментуйте його:
app.mount("/media", StaticFiles(directory=settings.media_dir), name="media") 