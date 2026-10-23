import os
import aiofiles
from pathlib import Path

# Local storage base directory for uploaded papers
DEFAULT_STORAGE_ROOT = Path(__file__).resolve().parent.parent.parent / "storage_files"
STORAGE_ROOT = Path(os.getenv("STORAGE_LOCAL_DIR", str(DEFAULT_STORAGE_ROOT)))

def get_paper_file_path(user_id: str, project_id: str, paper_id: str) -> Path:
    target_dir = STORAGE_ROOT / str(user_id) / str(project_id)
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir / f"{paper_id}.pdf"

async def save_upload_stream(file_stream, destination_path: Path) -> int:
    destination_path.parent.mkdir(parents=True, exist_ok=True)
    total_bytes = 0
    async with aiofiles.open(destination_path, "wb") as out_file:
        while True:
            chunk = await file_stream.read(1024 * 64) # 64 KB chunks
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > 52428800: # 50 MB limit
                raise ValueError("file_too_large")
            await out_file.write(chunk)
    return total_bytes
