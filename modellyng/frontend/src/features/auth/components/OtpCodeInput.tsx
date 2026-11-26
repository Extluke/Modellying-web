import React, { useRef } from "react"
import { cn } from "@/lib/utils"

interface OtpCodeInputProps {
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
  error?: boolean
  length?: number
}

export function OtpCodeInput({
  value,
  onChange,
  disabled = false,
  error = false,
  length = 6,
}: OtpCodeInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length }, (_, idx) => value[idx] ?? "")

  const focusIndex = (idx: number) => {
    const target = inputRefs.current[Math.max(0, Math.min(length - 1, idx))]
    target?.focus()
    target?.select()
  }

  const updateDigitAt = (idx: number, char: string) => {
    const nextChars = digits.slice()
    nextChars[idx] = char
    onChange(nextChars.join(""))
  }

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "")
    if (!cleaned) {
      updateDigitAt(idx, "")
      return
    }

    if (cleaned.length > 1) {
      const merged = digits.slice()
      for (let offset = 0; offset < cleaned.length && idx + offset < length; offset++) {
        merged[idx + offset] = cleaned[offset]
      }
      onChange(merged.join("").slice(0, length))
      focusIndex(Math.min(length - 1, idx + cleaned.length))
      return
    }

    updateDigitAt(idx, cleaned)
    if (idx < length - 1) {
      focusIndex(idx + 1)
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[idx]) {
        updateDigitAt(idx, "")
      } else if (idx > 0) {
        updateDigitAt(idx - 1, "")
        focusIndex(idx - 1)
      }
      e.preventDefault()
      return
    }

    if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault()
      focusIndex(idx - 1)
      return
    }

    if (e.key === "ArrowRight" && idx < length - 1) {
      e.preventDefault()
      focusIndex(idx + 1)
    }
  }

  const handlePaste = (idx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "")
    if (!pasted) {
      return
    }
    e.preventDefault()
    const next = digits.slice()
    const startIdx = pasted.length >= length ? 0 : idx
    for (let offset = 0; offset < pasted.length && startIdx + offset < length; offset++) {
      next[startIdx + offset] = pasted[offset]
    }
    onChange(next.join("").slice(0, length))
    focusIndex(Math.min(length - 1, startIdx + pasted.length - 1))
  }

  return (
    <div className="flex items-center justify-between gap-2" role="group" aria-label="Kode verifikasi 6 digit">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={length}
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          aria-label={`Digit verifikasi ${idx + 1}`}
          aria-invalid={error}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={(e) => handlePaste(idx, e)}
          className={cn(
            "h-12 w-full max-w-[54px] rounded-xl border bg-card text-center font-mono text-lg font-bold text-foreground shadow-sm transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            error && "border-status-red focus-visible:ring-status-red"
          )}
        />
      ))}
    </div>
  )
}
