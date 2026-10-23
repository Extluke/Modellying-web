from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150, description="Judul atau topik proyek riset")
    description: Optional[str] = Field(None, max_length=1000, description="Deskripsi singkat atau abstrak proyek")

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, pattern="^(active|archived)$")

class PaperConfirmRequest(BaseModel):
    action: str = Field(..., pattern="^(proceed|discard)$")

# Full Data Contract v1 matching Section 6 of the Architecture Document
class PaperItem(BaseModel):
    id: str
    title: str
    file_name: str
    file_size_bytes: int
    total_pages: int = 0
    sha256: Optional[str] = None
    status: str
    stage: Optional[str] = None
    stage_detail: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    warnings: List[str] = []
    coverage: Optional[Dict[str, Any]] = None
    doc_type: Optional[Dict[str, Any]] = None
    run: Optional[Dict[str, Any]] = None
    uploaded_at: str
    updated_at: Optional[str] = None

class PaperCreateRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    file_name: str = Field(..., min_length=1)
    file_size_bytes: int = Field(default=1024)
    total_pages: Optional[int] = Field(default=1)
    authors: Optional[List[str]] = Field(default=[])
    year: Optional[int] = Field(default=None)

class ComponentItem(BaseModel):
    id: str
    paper_id: str
    parameter_key: str
    parameter_version: int = 1
    label: Dict[str, Any]
    group_name: str
    tab_group: Optional[str] = "konteks_masalah"
    instruction: str
    sort_order: int
    state: str
    value: Dict[str, Any]
    evidence: List[Dict[str, Any]] = []
    confidence_score: Optional[float] = None
    status: str
    reviewer_notes: Optional[str] = None
    created_at: str
    updated_at: str

class BlockItem(BaseModel):
    block_id: str
    page_number: int
    page_label: Optional[str] = None
    bbox: List[float]
    text: str

class ComponentUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, pattern="^(needs_review|accepted|edited|rejected)$")
    value: Optional[Dict[str, Any]] = None
    reviewer_notes: Optional[str] = None

class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Pertanyaan riset")

class CitationItem(BaseModel):
    citation_id: str
    paper_id: str
    paper_title: str
    file_name: str
    page_number: int
    block_id: str
    bbox: List[float]
    quote: str

class ChatResponse(BaseModel):
    answer: str
    citations: List[CitationItem] = []

class ChatMessageHistoryItem(BaseModel):
    id: str
    role: str
    content: str
    citations: List[Dict[str, Any]] = []
    created_at: str

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

class ComponentAiReviseRequest(BaseModel):
    user_instruction: str
    current_text: str
    history: Optional[List[Dict[str, Any]]] = None

class ComponentAiReviseResponse(BaseModel):
    revised_text: str
    explanation: Optional[str] = None
