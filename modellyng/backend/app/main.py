from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth.router import auth_router
from .projects.router import projects_router

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

# Register routers
app.include_router(auth_router)
app.include_router(projects_router)


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
