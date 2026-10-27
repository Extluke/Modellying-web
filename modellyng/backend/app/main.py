import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env file from modellyng/backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from .auth.router import auth_router
from .projects.router import projects_router, papers_router
from .admin.router import admin_router, public_announcements_router

app = FastAPI(
    title="Modellyng Academic PDF Analysis API",
    description="Evidence-Centered Academic PDF Analysis API with Argon2 Authentication and RAG Services.",
    version="1.0.0",
)

# CORS configuration allowing local frontend development origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers (Supports root, /api, and /api/v1 for maximum client compatibility)
app.include_router(auth_router)
app.include_router(auth_router, prefix="/api")
app.include_router(auth_router, prefix="/api/v1")

app.include_router(projects_router)
app.include_router(projects_router, prefix="/api")
app.include_router(projects_router, prefix="/api/v1")

app.include_router(papers_router)
app.include_router(papers_router, prefix="/api")
app.include_router(papers_router, prefix="/api/v1")

app.include_router(admin_router)
app.include_router(admin_router, prefix="/api")
app.include_router(admin_router, prefix="/api/v1")

app.include_router(public_announcements_router)
app.include_router(public_announcements_router, prefix="/api")
app.include_router(public_announcements_router, prefix="/api/v1")


@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "Modellyng Backend API",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
