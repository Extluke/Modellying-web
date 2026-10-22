from pydantic import BaseModel, Field
from typing import Optional, List

class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Judul atau topik proyek riset")
    description: Optional[str] = Field(None, max_length=1000, description="Deskripsi singkat atau abstrak proyek")

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(active|archived)$")

class PaperItem(BaseModel):
    id: str
    title: str
    file_name: str
    file_size_bytes: int
    status: str
    total_pages: int = 0
    uploaded_at: str

class PaperCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    file_name: str = Field(..., min_length=1)
    file_size_bytes: int = Field(default=1024)
    total_pages: Optional[int] = Field(default=1)
    authors: Optional[List[str]] = Field(default=[])
    year: Optional[int] = Field(default=None)

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    status: str = "active"
    paper_count: int = 0
    ready_count: int = 0
    created_at: str
    updated_at: str

class ProjectDetailResponse(ProjectResponse):
    papers: List[PaperItem] = []
