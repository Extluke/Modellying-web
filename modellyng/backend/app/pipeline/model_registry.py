"""
ModelRegistry & LLM Caller Abstraction — Modellyng Web
Evidence-Centered Academic Extraction Engine

Arsitektur:
1. Core Provider: Google Gemini (default: models/gemini-3.5-flash)
2. Backup Provider: Groq (default: qwen/qwen3.8-27b / openai/gpt-oss-120b)
3. Fitur Keamanan & Reliabilitas:
   - Token Bucket Rate Limiting (Sadar TPM & RPM)
   - Micro-Retry per Provider (Hingga 2x retry = 3x percobaan per model)
   - Exponential Backoff & Jitter pada status 429 / 503 / Timeout
   - Validasi Skema Pydantic Ketat (Strict JSON Outputs)
   - Provider Failover Otomatis (Gemini -> Groq)
   - Sanitized Logging: Dilarang keras menampilkan teks mentah dokumen di log
"""

import os
import json
import time
import random
import logging
from typing import Type, TypeVar, Tuple, Optional, Any, List
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv

from app.pipeline.rate_limiter import groq_limiter, gemini_limiter

load_dotenv()

logger = logging.getLogger("modellyng.pipeline.model_registry")

T = TypeVar("T", bound=BaseModel)

class ModelExecutionError(Exception):
    """Kesalahan umum saat eksekusi model LLM."""
    pass

class ModelRateLimitError(ModelExecutionError):
    """Penyedia AI mengalami rate limit atau lonjakan antrean (429 / 503)."""
    pass

class ModelSchemaValidationError(ModelExecutionError):
    """Output LLM gagal divalidasi oleh skema Pydantic."""
    pass

class AllModelsExhaustedError(ModelExecutionError):
    """Seluruh model (Core & Backup) telah menghabiskan kuota retry dan gagal."""
    def __init__(self, message: str, task_name: str, attempts_log: List[dict]):
        super().__init__(message)
        self.task_name = task_name
        self.attempts_log = attempts_log

class ModelProfile:
    """Profil konfigurasi model LLM independen."""
    def __init__(
        self,
        alias: str,
        provider: str,
        model_name: str,
        priority: int,
        fallback_models: Optional[List[str]] = None,
        max_retries: int = 2,
        backoff_base_seconds: float = 2.0,
    ):
        self.alias = alias
        self.provider = provider.lower()  # "gemini" | "groq"
        self.model_name = model_name
        self.priority = priority  # 1 = Core, 2 = Backup
        self.fallback_models = fallback_models or []
        self.max_retries = max_retries
        self.backoff_base_seconds = backoff_base_seconds

class ModelRegistry:
    """
    Registri terpusat untuk orkestrasi pemanggilan model AI dengan skema Core (Gemini) -> Backup (Groq).
    """
    def __init__(self):
        # Baca konfigurasi dari environment
        gemini_model = os.getenv("GEMINI_MODEL_NAME", "models/gemini-3.5-flash")
        groq_model = os.getenv("GROQ_MODEL_NAME", "qwen/qwen3.8-27b")

        # 1. Core Profile: Gemini
        self.core_profile = ModelProfile(
            alias="gemini-core",
            provider="gemini",
            model_name=gemini_model,
            priority=1,
            fallback_models=["models/gemini-3.7-flash", "models/gemini-3.8-flash"],
            max_retries=2,
            backoff_base_seconds=2.0
        )

        # 2. Backup Profile: Groq
        self.backup_profile = ModelProfile(
            alias="groq-backup",
            provider="groq",
            model_name=groq_model,
            priority=2,
            fallback_models=["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
            max_retries=2,
            backoff_base_seconds=2.0
        )

        self._gemini_client = None
        self._groq_client = None

    def get_gemini_client(self):
        if self._gemini_client is None:
            from google import genai
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ModelExecutionError("GEMINI_API_KEY tidak ditemukan pada berkas environment backend (.env).")
            self._gemini_client = genai.Client(api_key=api_key)
        return self._gemini_client

    def get_groq_client(self):
        if self._groq_client is None:
            from groq import Groq
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ModelExecutionError("GROQ_API_KEY tidak ditemukan pada berkas environment backend (.env).")
            self._groq_client = Groq(api_key=api_key)
        return self._groq_client

    def execute_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
        task_name: str = "Batch Extraction",
        temperature: float = 0.1,
    ) -> Tuple[T, str]:
        """
        Mengeksekusi pemanggilan LLM dengan jaminan Pydantic & Dual-Provider Failover:
        1. Coba Core (Gemini) -> Up to 3x percobaan (1 panggilan + 2 micro-retry)
        2. Jika gagal total -> Switch ke Backup (Groq) -> Up to 3x percobaan
        3. Jika keduanya gagal -> AllModelsExhaustedError
        """
        attempts_log = []

        # TAHAP 1: EKSEKUSI DI CORE MODEL (GEMINI)
        logger.info(f"[{task_name}] Memulai eksekusi pada Core Model: {self.core_profile.alias} ({self.core_profile.model_name})")
        success, result, log_entries = self._invoke_with_micro_retry(
            profile=self.core_profile,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=response_model,
            task_name=task_name,
            temperature=temperature
        )
        attempts_log.extend(log_entries)

        if success and result is not None:
            logger.info(f"[{task_name}] Eksekusi berhasil menggunakan Core Model ({self.core_profile.alias})")
            return result, self.core_profile.alias

        # TAHAP 2: FAILOVER KE BACKUP MODEL (GROK)
        logger.warning(
            f"[{task_name}] Core Model ({self.core_profile.alias}) gagal setelah {self.core_profile.max_retries + 1}x percobaan. "
            f"Melakukan FAILOVER ke Backup Model: {self.backup_profile.alias} ({self.backup_profile.model_name})"
        )

        success, result, log_entries = self._invoke_with_micro_retry(
            profile=self.backup_profile,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=response_model,
            task_name=task_name,
            temperature=temperature
        )
        attempts_log.extend(log_entries)

        if success and result is not None:
            logger.info(f"[{task_name}] Eksekusi berhasil menggunakan Backup Model ({self.backup_profile.alias})")
            return result, self.backup_profile.alias

        # TAHAP 3: KEDUA PROVIDER GAGAL TOTAL
        error_msg = (
            f"Seluruh model (Gemini Core & Groq Backup) gagal memproses unit tugas '{task_name}'. "
            f"Total percobaan: {len(attempts_log)}x. Tidak ada data palsu yang disisipkan ke basis data."
        )
        logger.error(f"[{task_name}] {error_msg}")
        raise AllModelsExhaustedError(
            message=error_msg,
            task_name=task_name,
            attempts_log=attempts_log
        )

    def _invoke_with_micro_retry(
        self,
        profile: ModelProfile,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[T],
        task_name: str,
        temperature: float
    ) -> Tuple[bool, Optional[T], List[dict]]:
        """Menangani micro-retry dengan exponential backoff dan token bucket pada satu provider."""
        log_entries = []
        max_attempts = profile.max_retries + 1
        active_model_name = profile.model_name

        for attempt in range(1, max_attempts + 1):
            start_time = time.time()
            log_meta = {
                "provider": profile.provider,
                "model": active_model_name,
                "attempt": attempt,
                "status": "pending"
            }

            try:
                # 1. Batasi Laju (Token Bucket Rate Limiter)
                if profile.provider == "gemini":
                    gemini_limiter.acquire(wait=True)
                else:
                    groq_limiter.acquire(wait=True)

                # 2. Panggil API Provider
                raw_json = ""
                if profile.provider == "gemini":
                    raw_json = self._call_gemini_raw(
                        model_name=active_model_name,
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        response_model=response_model,
                        temperature=temperature
                    )
                else:
                    raw_json = self._call_groq_raw(
                        model_name=active_model_name,
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        response_model=response_model,
                        temperature=temperature
                    )

                # 3. Validasi Skema Pydantic Ketat
                parsed_data = response_model.model_validate_json(raw_json)

                elapsed = round(time.time() - start_time, 2)
                log_meta["status"] = "success"
                log_meta["elapsed_sec"] = elapsed
                log_entries.append(log_meta)
                logger.info(f"[{task_name}][{profile.alias}] Percobaan ke-{attempt} sukses ({elapsed}s)")
                return True, parsed_data, log_entries

            except ValidationError as ve:
                elapsed = round(time.time() - start_time, 2)
                log_meta["status"] = "validation_error"
                log_meta["error"] = str(ve)[:200]
                log_entries.append(log_meta)
                logger.warning(
                    f"[{task_name}][{profile.alias}] Percobaan ke-{attempt} gagal validasi Pydantic ({elapsed}s). "
                    f"Rincian: {str(ve)[:120]}"
                )

            except Exception as exc:
                elapsed = round(time.time() - start_time, 2)
                err_str = str(exc)
                is_rate_limit = any(k in err_str for k in ["429", "RESOURCE_EXHAUSTED", "rate_limit_exceeded", "503", "UNAVAILABLE"])
                log_meta["status"] = "rate_limit" if is_rate_limit else "api_error"
                log_meta["error"] = err_str[:200]
                log_entries.append(log_meta)

                logger.warning(
                    f"[{task_name}][{profile.alias}] Percobaan ke-{attempt} gagal ({'RateLimit' if is_rate_limit else 'Error'}): {err_str[:120]}"
                )

                # Jika model spesifik 404 / deprecated, coba alihkan ke fallback model jika ada
                if "404" in err_str and profile.fallback_models and attempt == 1:
                    active_model_name = profile.fallback_models[0]
                    logger.info(f"[{task_name}][{profile.alias}] Mengalihkan nama model ke alternatif: {active_model_name}")

            # Jeda Exponential Backoff sebelum micro-retry berikutnya
            if attempt < max_attempts:
                backoff_time = (profile.backoff_base_seconds ** attempt) + (random.uniform(0.1, 0.5))
                logger.info(f"[{task_name}][{profile.alias}] Menunggu backoff {backoff_time:.2f}s sebelum retry...")
                time.sleep(backoff_time)

        return False, None, log_entries

    def _call_gemini_raw(
        self,
        model_name: str,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[BaseModel],
        temperature: float
    ) -> str:
        """Pemanggilan murni ke Google Gemini API (Interactions / SDK terbaru)."""
        client = self.get_gemini_client()
        
        # Gabungkan system prompt ke dalam konfigurasi atau konten
        full_content = f"SYSTEM INSTRUCTION:\n{system_prompt}\n\nUSER PROMPT:\n{user_prompt}"

        response = client.models.generate_content(
            model=model_name,
            contents=full_content,
            config={
                "response_mime_type": "application/json",
                "response_schema": response_model,
                "temperature": temperature,
            }
        )
        return response.text or "{}"

    def _call_groq_raw(
        self,
        model_name: str,
        system_prompt: str,
        user_prompt: str,
        response_model: Type[BaseModel],
        temperature: float
    ) -> str:
        """Pemanggilan murni ke Groq API dengan JSON Mode dan injeksi skema Pydantic."""
        client = self.get_groq_client()

        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        schema_instruction = (
            f"\n\nWAJIB: Kembalikan respons HANYA dalam format JSON valid yang secara ketat mematuhi skema berikut:\n"
            f"```json\n{schema_json}\n```\n"
            f"Pastikan seluruh kunci properti di dalam JSON persis sama seperti pada skema di atas."
        )

        messages = [
            {"role": "system", "content": f"{system_prompt}{schema_instruction}"},
            {"role": "user", "content": user_prompt}
        ]

        chat = client.chat.completions.create(
            messages=messages,
            model=model_name,
            response_format={"type": "json_object"},
            temperature=temperature,
        )
        return chat.choices[0].message.content or "{}"

# Singleton instance
model_registry = ModelRegistry()
