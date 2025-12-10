"use client"

interface BilingualTextProps {
  english: string
  arabic: string
  className?: string
  showArabic?: boolean
}

export function BilingualText({ english, arabic, className = "", showArabic = true }: BilingualTextProps) {
  return (
    <>
      <span className={className}>{english}</span>
      {showArabic && (
        <span className={`font-[family-name:'Noto Sans Arabic',sans-serif] ${className}`} style={{ marginRight: '0.5rem' }}>
          {arabic}
        </span>
      )}
    </>
  )
}

