from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# ==============================================================================
# 1. DASBOR METRIK & USER RATIO (Job 1)
# ==============================================================================
class AdminActivityItem(BaseModel):
    id: str
    event_type: str  # "user_registered" | "paper_uploaded" | "extraction_complete" | "plan_purchased"
    title: str
    description: str
    timestamp: str

class PlanDistributionItem(BaseModel):
    code: str
    name: str
    subscriber_count: int
    percentage: float

class AdminDashboardMetricsResponse(BaseModel):
    total_users: int = Field(..., description="Total pengguna terdaftar di platform")
    subscribed_users_count: int = Field(0, description="Total pengguna aktif berlangganan (Pro/Enterprise)")
    free_users_count: int = Field(0, description="Total pengguna paket gratis (Free Explorer)")
    subscribed_ratio_percent: float = Field(0.0, description="Persentase user berlangganan vs total")
    total_revenue_idr: float = Field(0.0, description="Total estimasi pendapatan berlangganan dalam IDR")
    plan_distribution: List[PlanDistributionItem] = Field(default_factory=list, description="Distribusi langganan per paket")
    total_projects: int = Field(..., description="Total ruang riset/proyek aktif")
    total_papers: int = Field(..., description="Total dokumen ilmiah yang diunggah")
    total_extracted_components: int = Field(0, description="Total komponen ilmiah hasil analisis AI")
    papers_by_status: Dict[str, int] = Field(default_factory=dict, description="Distribusi status pemrosesan dokumen")
    worker_queue_load: str = Field("Optimal (100%)", description="Status beban antrean worker pemrosesan")
    redis_status: str = Field("connected", description="Status konektivitas broker Redis")
    estimated_tokens_today: str = Field("0", description="Estimasi konsumsi token AI hari ini")
    recent_activity: List[AdminActivityItem] = Field(default_factory=list, description="Aktivitas terkini pada sistem")


# ==============================================================================
# 2. MANAJEMEN PENGGUNA & LAPORAN BUG (Job 2)
# ==============================================================================
class AdminUserItem(BaseModel):
    id: str
    email: str
    full_name: str
    institution: Optional[str] = None
    role: str
    status: str = "active"  # active, suspended, deactivated
    suspension_reason: Optional[str] = None
    subscription_tier: str = "free"
    citation_format: str = "APA"
    total_projects: int = 0
    total_papers: int = 0
    created_at: str
    updated_at: str

class AdminUserListResponse(BaseModel):
    users: List[AdminUserItem]
    total: int
    page: int
    page_size: int

class AdminUserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Hak akses baru: 'researcher' atau 'admin'")

class AdminUserStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Status pengguna: 'active', 'suspended', atau 'deactivated'")
    suspension_reason: Optional[str] = Field(None, description="Alasan penonaktifan atau penangguhan akun")

class AdminUserPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=6, description="Kata sandi baru pengguna")

class AdminBugReportItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    title: str
    description: str
    page_url: Optional[str] = None
    severity: str = "medium"  # low, medium, high, critical
    status: str = "open"      # open, investigating, resolved, closed
    admin_notes: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None

class AdminBugReportUpdateRequest(BaseModel):
    status: str = Field(..., description="Status tiket: open, investigating, resolved, closed")
    admin_notes: Optional[str] = Field(None, description="Catatan tindakan resolusi dari admin")


# ==============================================================================
# 3. MANAJEMEN LANGGANAN CMS (Job 3)
# ==============================================================================
class SubscriptionPlanItem(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "IDR"
    billing_period: str = "monthly"
    paper_limit_per_month: int = 50
    ai_query_limit_per_day: int = 100
    features: List[str] = Field(default_factory=list)
    is_active: bool = True
    is_popular: bool = False
    sort_order: int = 1
    active_subscribers_count: int = 0
    created_at: str
    updated_at: str

class SubscriptionPlanCreateRequest(BaseModel):
    code: str = Field(..., description="Kode unik paket, misal: pro_scholar")
    name: str = Field(..., description="Nama tampilan paket")
    description: Optional[str] = None
    price: float = Field(..., ge=0, description="Harga paket dalam IDR")
    currency: str = "IDR"
    billing_period: str = "monthly"  # free, monthly, annual, lifetime
    paper_limit_per_month: int = 50
    ai_query_limit_per_day: int = 100
    features: List[str] = Field(default_factory=list)
    is_active: bool = True
    is_popular: bool = False
    sort_order: int = 1

class SubscriptionPlanUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    billing_period: Optional[str] = None
    paper_limit_per_month: Optional[int] = None
    ai_query_limit_per_day: Optional[int] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_popular: Optional[bool] = None
    sort_order: Optional[int] = None


# ==============================================================================
# 4. PENGUMUMAN & PROMO CMS (Job 4)
# ==============================================================================
class AnnouncementItem(BaseModel):
    id: str
    title: str
    content: str
    summary: Optional[str] = None
    category: str = "info"  # promo, info, update, terms, program
    badge_text: Optional[str] = None
    banner_url: Optional[str] = None
    target_role: str = "all"  # all, researcher, subscribed_only
    status: str = "draft"    # draft, scheduled, published, archived
    scheduled_at: Optional[str] = None
    published_at: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str
    updated_at: str

class AnnouncementCreateRequest(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    category: str = "promo"
    badge_text: Optional[str] = None
    banner_url: Optional[str] = None
    target_role: str = "all"
    status: str = "published"
    scheduled_at: Optional[str] = None

class AnnouncementUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    badge_text: Optional[str] = None
    banner_url: Optional[str] = None
    target_role: Optional[str] = None
    status: Optional[str] = None
    scheduled_at: Optional[str] = None


# ==============================================================================
# 5. DYNAMIC API CONFIGURATION (Job 5)
# ==============================================================================
class ApiConfigItem(BaseModel):
    id: str
    provider: str  # gemini, groq, openai, anthropic
    display_name: str
    model_name: str
    api_key_masked: str
    priority: int  # 1 = Primary, 2 = Backup
    rpm_limit: int
    tpm_limit: int
    is_active: bool
    status: str  # operational, rate_limited, invalid_key, unconfigured
    last_tested_at: Optional[str] = None
    last_latency_ms: Optional[int] = None
    updated_at: str

class ApiConfigUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    model_name: Optional[str] = None
    api_key: Optional[str] = None
    priority: Optional[int] = None
    rpm_limit: Optional[int] = None
    tpm_limit: Optional[int] = None
    is_active: Optional[bool] = None

class ApiConfigTestResult(BaseModel):
    provider: str
    success: bool
    latency_ms: int
    status: str
    message: str


# ==============================================================================
# 6. SESAMA ADMIN & AUDIT LOGS (Job 6)
# ==============================================================================
class AdminAccountItem(BaseModel):
    id: str
    email: str
    full_name: str
    institution: Optional[str] = None
    admin_role: str = "admin"  # super_admin, support_admin, content_admin, admin
    admin_permissions: List[str] = Field(default_factory=list)
    created_at: str
    updated_at: str

class AdminAccountCreateRequest(BaseModel):
    email: str = Field(..., description="Email administrator")
    full_name: str
    password: str = Field(..., min_length=6)
    institution: Optional[str] = "Modellyng Core Team"
    admin_role: str = "admin"
    admin_permissions: List[str] = Field(default_factory=lambda: ["manage_users", "manage_cms"])

class AdminAccountUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    admin_role: Optional[str] = None
    admin_permissions: Optional[List[str]] = None

class AdminAuditLogItem(BaseModel):
    id: str
    admin_id: Optional[str] = None
    admin_email: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    created_at: str

class AdminMessageResponse(BaseModel):
    success: bool = True
    message: str
