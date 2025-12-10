"use client"

import { useState, useEffect } from 'react'

export function Alpha100Section() {
  const [spotsRemaining, setSpotsRemaining] = useState(100)
  const [inviteCode, setInviteCode] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [background, setBackground] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [isFormValid, setIsFormValid] = useState(false)

  // Valid invitation codes (first 30 for client-side validation)
  const validCodes = new Set([
    'BZ-N26R-GMDA', 'BZ-58NC-KHFY', 'BZ-KG4E-UZA9', 'BZ-U2Q3-2XSP',
    'BZ-HSB7-JYTW', 'BZ-TN86-ZA7X', 'BZ-MCYD-TDQK', 'BZ-DXRE-VEUN',
    'BZ-BK2V-G9GP', 'BZ-SNX7-YJCU', 'BZ-7HBJ-PNKQ', 'BZ-XFKB-WGZS',
    'BZ-PRMH-YWUF', 'BZ-GX42-KTEC', 'BZ-WRQA-9DTM', 'BZ-A8V6-NDHZ',
    'BZ-ZU3N-FMJS', 'BZ-QWYP-5ESR', 'BZ-M9KT-HJDC', 'BZ-4VE2-BXNW',
    'BZ-RZGF-8YPK', 'BZ-JDSC-3UQM', 'BZ-TNAH-6WKB', 'BZ-VPXF-Z9EY',
    'BZ-FK7S-MPDU', 'BZ-B2QW-RETC', 'BZ-X5HG-AJNV', 'BZ-ND8M-4UKZ',
    'BZ-YPRW-QGJS', 'BZ-39CE-VHTB'
  ])

  // Check form validity
  useEffect(() => {
    const codeValid = validCodes.has(inviteCode.toUpperCase())
    const nameValid = name.trim().length > 0
    const emailValid = email.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    const backgroundValid = background.trim().length > 0

    setIsFormValid(codeValid && nameValid && emailValid && backgroundValid)
  }, [inviteCode, name, email, background])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')

    // Auto-format as user types: BZ-XXXX-XXXX
    if (value.length >= 2 && !value.startsWith('BZ-')) {
      if (value.startsWith('BZ')) {
        value = value.slice(0, 2) + '-' + value.slice(2)
      }
    }

    if (value.length > 2 && value.charAt(2) !== '-') {
      value = value.slice(0, 2) + '-' + value.slice(2)
    }

    if (value.length > 7 && value.charAt(7) !== '-') {
      const parts = value.split('-')
      if (parts.length === 2 && parts[1].length > 4) {
        value = parts[0] + '-' + parts[1].slice(0, 4) + '-' + parts[1].slice(4)
      }
    }

    if (value.length > 13) {
      value = value.slice(0, 13)
    }

    setInviteCode(value)

    // Validate code format and existence
    const pattern = /^BZ-[A-Z0-9]{4}-[A-Z0-9]{4}$/

    if (value.length === 13 && pattern.test(value)) {
      if (validCodes.has(value)) {
        setValidationMessage('<span style="color: #D4AF37; font-weight: 600;">✅ Valid invitation code - Now fill all fields to continue</span>')
        e.target.style.borderColor = '#D4AF37'
        e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.1)'
      } else {
        setValidationMessage('<span style="color: #ff6b6b; font-weight: 600;">❌ Invalid invitation code</span>')
        e.target.style.borderColor = '#ff6b6b'
        e.target.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)'
      }
    } else if (value.length > 0) {
      setValidationMessage('<span style="color: rgba(255,255,255,0.7); font-size: 0.85rem;">Format: BZ-XXXX-XXXX</span>')
      e.target.style.borderColor = ''
      e.target.style.boxShadow = ''
    } else {
      setValidationMessage('')
      e.target.style.borderColor = ''
      e.target.style.boxShadow = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) return

    setIsSubmitting(true)

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Reset form
      setInviteCode('')
      setName('')
      setEmail('')
      setBackground('')
      setValidationMessage('')
      setSpotsRemaining(prev => Math.max(0, prev - 1))

      alert('🎉 Welcome to Alpha-100! Check your email for next steps.')
    } catch (error) {
      console.error('Form submission error:', error)
      alert('❌ Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="alpha-100" className="py-24 px-8">
      <div className="container max-w-7xl mx-auto">
        <div className="section-header text-center mb-16 fade-in">
          <div className="section-badge inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-4 py-2 rounded-full text-sm font-600 mb-4 uppercase tracking-wider">
            Join Now
          </div>
          <h2 className="section-title text-4xl md:text-6xl font-800 mb-6 text-white">
            Alpha-100: Be the First
          </h2>
          <p className="section-subtitle text-xl text-[rgba(255,255,255,0.7)] max-w-3xl mx-auto leading-relaxed">
            100 founding members. 100% FREE. Lifetime benefits. Shape the future of AI that rewards humanity.
          </p>
        </div>

        <div className="alpha-benefits grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            "Early access to BIZRA OS before public launch",
            "Lifetime 50% discount on premium features",
            "Founding member NFT badge and recognition",
            "Direct input on feature roadmap and priorities",
            "Exclusive community access with fellow pioneers",
            "Bonus SEED tokens for early participation"
          ].map((benefit, index) => (
            <div key={index} className="benefit-item flex gap-3 fade-in">
              <div className="benefit-icon w-6 h-6 flex-shrink-0">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="benefit-text text-[rgba(255,255,255,0.7)] text-base">{benefit}</div>
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="alpha-exclusivity-badge inline-flex items-center gap-4 bg-[rgba(212,175,55,0.1)] border-2 border-[#D4AF37] px-8 py-4 rounded-full mb-4">
            <span className="text-3xl">🎫</span>
            <div className="text-left">
              <div className="font-700 text-[#D4AF37] text-base uppercase tracking-wider">
                INVITATION ONLY
                <span className="font-normal text-sm block mt-1 opacity-80">بالدعوة فقط</span>
              </div>
              <div className="text-[rgba(255,255,255,0.7)] text-sm">
                <span id="spots-remaining">{spotsRemaining}</span> Spots Available
                <span className="opacity-60 ml-2">• {spotsRemaining} مقعد متاح</span>
              </div>
            </div>
          </div>
          <p className="text-[rgba(255,255,255,0.7)] max-w-4xl mx-auto leading-relaxed">
            Join the exclusive Alpha-100 program. Limited to 100 visionary pioneers who will shape the future of humanitarian AI.
            <br />
            <span className="text-[#D4AF37] opacity-70 text-sm mt-2 block">أنضم إلى برنامج ألفا-١٠٠ الحصري. محدود ل ١٠٠ رائد بصري سيشكلون مستقبل الذكاء الاصطناعي الإنساني</span>
          </p>
        </div>

        <div className="form-container max-w-2xl mx-auto">
          <div className="glass-card p-8 bg-[rgba(255,255,255,0.05)] backdrop-blur-10 border border-[rgba(212,175,55,0.2)] rounded-3xl">
            <form id="alpha-signup-form" onSubmit={handleSubmit}>
              <div className="form-group mb-6">
                <label className="form-label block mb-2 font-600 text-white" htmlFor="inviteCode">
                  Invitation Code <span className="text-red-400">*</span>
                  <span className="text-[#D4AF37] text-sm ml-2">رمز الدعوة</span>
                </label>
                <input
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={handleCodeChange}
                  className="form-input w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-xl text-white font-mono text-lg uppercase tracking-wider transition-all duration-300 focus:border-[#D4AF37] focus:bg-[rgba(255,255,255,0.08)]"
                  placeholder="BZ-XXXX-XXXX"
                  pattern="BZ-[A-Z0-9]{4}-[A-Z0-9]{4}"
                  style={{ letterSpacing: '2px', fontSize: '1.1rem' }}
                  required
                  autoComplete="off"
                />
                <div className="validation-message block mt-2 text-sm font-500 min-h-5"
                     dangerouslySetInnerHTML={{ __html: validationMessage }}>
                </div>
                <div className="mt-2 text-xs text-[rgba(255,255,255,0.6)]">
                  Enter your exclusive invitation code to proceed
                  <br />
                  <span className="text-[#D4AF37] opacity-70">أدخل رمز الدعوة الحصري الخاص بك للمتابعة</span>
                </div>
              </div>

              <div className="form-group mb-6">
                <label className="form-label block mb-2 font-600 text-white" htmlFor="name">
                  Full Name
                  <span className="text-[#D4AF37] text-sm ml-2">الاسم الكامل</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-xl text-white transition-all duration-300 focus:border-[#D4AF37] focus:bg-[rgba(255,255,255,0.08)]"
                  required
                />
              </div>

              <div className="form-group mb-6">
                <label className="form-label block mb-2 font-600 text-white" htmlFor="email">
                  Email Address
                  <span className="text-[#D4AF37] text-sm ml-2">البريد الإلكتروني</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-xl text-white transition-all duration-300 focus:border-[#D4AF37] focus:bg-[rgba(255,255,255,0.08)]"
                  required
                />
              </div>

              <div className="form-group mb-8">
                <label className="form-label block mb-2 font-600 text-white" htmlFor="background">
                  Why do you want to join Alpha-100?
                  <span className="text-[#D4AF37] text-sm ml-2 block mt-1">لماذا تريد الانضمام إلى ألفا-١٠٠؟</span>
                </label>
                <textarea
                  id="background"
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  className="form-textarea w-full px-4 py-3 bg-[rgba(255,255,255,0.05)] border border-[rgba(212,175,55,0.2)] rounded-xl text-white resize-vertical min-h-32 transition-all duration-300 focus:border-[#D4AF37] focus:bg-[rgba(255,255,255,0.08)]"
                  placeholder="Tell us about your interest in BIZRA and what you hope to contribute..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="form-submit w-full bg-[#D4AF37] text-[#0A1828] px-8 py-4 rounded-full font-700 text-lg border-2 border-[#D4AF37] transition-all duration-300 hover:bg-transparent hover:text-[#D4AF37] transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>{isSubmitting ? 'Submitting...' : 'Verify Code & Join Alpha-100 (100% FREE)'}</span>
                <span className="text-sm block mt-1 font-500">تحقق من الرمز وانضم إلى ألفا-١٠٠ (مجاناً ١٠٠٪)</span>
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-[rgba(212,175,55,0.2)] text-center">
              <h3 className="text-[#D4AF37] text-lg font-700 mb-2">
                Don't have an invitation code?
              </h3>
              <p className="text-[#D4AF37] text-sm opacity-70 mb-4">
                ليس لديك رمز دعوة؟
              </p>
              <p className="text-[rgba(255,255,255,0.7)] mb-6 leading-relaxed">
                Alpha-100 is currently invitation-only. Codes are distributed to:
                <br />
                <span className="text-[#D4AF37] text-xs opacity-70 mt-2 block">ألفا-١٠٠ حالياً بالدعوة فقط. يتم توزيع الرموز على:</span>
              </p>
              <ul className="text-[rgba(255,255,255,0.7)] text-left max-w-md mx-auto mb-6 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  <span className="text-sm">Early supporters and community members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  <span className="text-sm">Selected applicants from our waitlist</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  <span className="text-sm">Strategic partners and advisors</span>
                </li>
              </ul>
              <p className="text-[rgba(255,255,255,0.7)]">
                <a href="mailto:m.beshr@bizra.info?subject=Alpha-100 Waitlist Request" className="text-[#D4AF37] hover:underline font-600">
                  Request to join the waitlist →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
