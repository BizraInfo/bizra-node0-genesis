"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { BilingualText } from "./BilingualText"
import { bilingualContent } from "@/lib/i18n"
import { formatInvitationCode, validateInvitationCode } from "@/lib/alpha100-validation"
import { alpha100FormSchema, type Alpha100FormData } from "@/lib/validation"
import { z } from "zod"
import { CheckCircle, Loader2 } from "lucide-react"

const benefits = [
  { en: "Early access to BIZRA OS before public launch", ar: "وصول مبكر إلى BIZRA OS قبل الإطلاق العام" },
  { en: "Lifetime 50% discount on premium features", ar: "خصم 50٪ مدى الحياة على الميزات المميزة" },
  { en: "Founding member NFT badge and recognition", ar: "شارة NFT للعضو المؤسس والاعتراف" },
  { en: "Direct input on feature roadmap and priorities", ar: "مدخلات مباشرة على خارطة طريق الميزات والأولويات" },
  { en: "Exclusive community access with fellow pioneers", ar: "وصول حصري للمجتمع مع الرواد الآخرين" },
  { en: "Bonus SEED tokens for early participation", ar: "رموز SEED إضافية للمشاركة المبكرة" },
]

export function Alpha100Section() {
  const [formData, setFormData] = useState<Alpha100FormData>({
    invitation_code: "",
    name: "",
    email: "",
    background: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof Alpha100FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; message: string }>({
    valid: false,
    message: "",
  })

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInvitationCode(e.target.value)
    setFormData((prev) => ({ ...prev, invitation_code: formatted }))

    const validation = validateInvitationCode(formatted)
    setCodeValidation(validation)
    if (errors.invitation_code) {
      setErrors((prev) => ({ ...prev, invitation_code: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const validatedData = alpha100FormSchema.parse(formData)
      // TODO: Replace with actual API call to Netlify Forms or backend
      await new Promise((resolve) => setTimeout(resolve, 1000))
      console.log("Form submitted:", validatedData)
      setIsSubmitted(true)
      setFormData({ invitation_code: "", name: "", email: "", background: "" })
      setTimeout(() => setIsSubmitted(false), 5000)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof Alpha100FormData, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof Alpha100FormData] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof Alpha100FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const isFormValid = codeValidation.valid && formData.name && formData.email && formData.background

  return (
    <section id="alpha-100" className="py-24 px-8 relative">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block bg-[rgba(212,175,55,0.1)] border border-[#D4AF37] text-[#D4AF37] px-5 py-2 rounded-[50px] text-[0.85rem] font-semibold mb-4 uppercase tracking-[1px]">
            <BilingualText {...bilingualContent.sections.alpha100.badge} />
          </div>
          <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold mb-4 text-white">
            {bilingualContent.sections.alpha100.title.en}
          </h2>
          <p className="text-[clamp(1rem,2vw,1.3rem)] text-[rgba(255,255,255,0.7)] max-w-[700px] mx-auto">
            {bilingualContent.sections.alpha100.subtitle.en}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-[30px] h-[30px] flex-shrink-0">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#D4AF37] fill-none stroke-2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-[rgba(255,255,255,0.7)] text-base">
                <span>{benefit.en}</span>
                <br />
                <span className="font-['Noto_Sans_Arabic',sans-serif] text-[rgba(212,175,55,0.8)]">{benefit.ar}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-4 bg-[rgba(212,175,55,0.1)] border-2 border-[#D4AF37] px-8 py-4 rounded-[50px] mb-4">
            <span className="text-[2rem]">🎫</span>
            <div className="text-left">
              <div className="font-bold text-[#D4AF37] text-base tracking-[2px]">
                INVITATION ONLY
                <span className="block font-['Noto_Sans_Arabic',sans-serif] text-[0.9rem] tracking-0 mt-1">
                  بالدعوة فقط
                </span>
              </div>
              <div className="text-[rgba(255,255,255,0.7)] text-[0.85rem]">
                <span id="spots-remaining">100</span> Spots Available
                <span className="font-['Noto_Sans_Arabic',sans-serif] mr-2">• ١٠٠ مقعد متاح</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[600px] mx-auto">
          <Card className="p-8 bg-[rgba(255,255,255,0.05)] backdrop-blur-[10px] border border-[rgba(212,175,55,0.2)] rounded-[20px]">
            <CardContent className="p-0">
              {isSubmitted && (
                <div className="p-4 bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-lg flex items-center gap-3 text-[#D4AF37] mb-6">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Application submitted successfully! We'll review it within 48 hours.</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="inviteCode" className="block mb-2 font-semibold text-[rgba(255,255,255,0.95)]">
                    <BilingualText {...bilingualContent.form.invitationCode.label} />{" "}
                    <span className="text-[#ff6b6b]">*</span>
                  </label>
                  <Input
                    id="inviteCode"
                    value={formData.invitation_code}
                    onChange={handleCodeChange}
                    placeholder="BZ-XXXX-XXXX"
                    required
                    className={`bg-[rgba(255,255,255,0.05)] border-[rgba(212,175,55,0.2)] text-white placeholder:text-[rgba(255,255,255,0.5)] uppercase font-mono tracking-[2px] text-[1.1rem] ${
                      codeValidation.valid ? "border-[#D4AF37]" : codeValidation.message.includes("Invalid") ? "border-[#ff6b6b]" : ""
                    }`}
                    style={{
                      borderColor: codeValidation.valid
                        ? "#D4AF37"
                        : codeValidation.message.includes("Invalid")
                          ? "#ff6b6b"
                          : undefined,
                      boxShadow: codeValidation.valid ? "0 0 0 3px rgba(212, 175, 55, 0.1)" : undefined,
                    }}
                  />
                  {codeValidation.message && (
                    <div
                      className={`mt-2 text-sm font-semibold ${
                        codeValidation.valid ? "text-[#D4AF37]" : codeValidation.message.includes("Invalid") ? "text-[#ff6b6b]" : "text-[rgba(255,255,255,0.7)]"
                      }`}
                    >
                      {codeValidation.message}
                    </div>
                  )}
                  <div className="mt-2 text-[0.85rem] text-[rgba(255,255,255,0.7)]">
                    {bilingualContent.form.invitationCode.help.en}
                    <br />
                    <span className="font-['Noto_Sans_Arabic',sans-serif] text-[0.8rem] text-[rgba(212,175,55,0.7)]">
                      {bilingualContent.form.invitationCode.help.ar}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block mb-2 font-semibold text-[rgba(255,255,255,0.95)]">
                    <BilingualText {...bilingualContent.form.name.label} />
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className="bg-[rgba(255,255,255,0.05)] border-[rgba(212,175,55,0.2)] text-white placeholder:text-[rgba(255,255,255,0.5)]"
                  />
                  {errors.name && <p className="mt-1 text-sm text-[#ff6b6b]">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 font-semibold text-[rgba(255,255,255,0.95)]">
                    <BilingualText {...bilingualContent.form.email.label} />
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                    className="bg-[rgba(255,255,255,0.05)] border-[rgba(212,175,55,0.2)] text-white placeholder:text-[rgba(255,255,255,0.5)]"
                  />
                  {errors.email && <p className="mt-1 text-sm text-[#ff6b6b]">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="background" className="block mb-2 font-semibold text-[rgba(255,255,255,0.95)]">
                    <BilingualText {...bilingualContent.form.background.label} />
                  </label>
                  <Textarea
                    id="background"
                    value={formData.background}
                    onChange={(e) => handleChange("background", e.target.value)}
                    required
                    className="bg-[rgba(255,255,255,0.05)] border-[rgba(212,175,55,0.2)] text-white placeholder:text-[rgba(255,255,255,0.5)] min-h-[120px]"
                    placeholder={bilingualContent.form.background.placeholder.en}
                  />
                  {errors.background && <p className="mt-1 text-sm text-[#ff6b6b]">{errors.background}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting || isSubmitted}
                  className="w-full bg-[#D4AF37] text-[#0A1828] hover:bg-transparent hover:text-[#D4AF37] border-2 border-[#D4AF37] rounded-[50px] py-6 text-[1.1rem] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {bilingualContent.form.submit.submitting.en}
                    </>
                  ) : isSubmitted ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Application Submitted
                    </>
                  ) : (
                    <>
                      <span>{bilingualContent.form.submit.text.en}</span>
                      <br />
                      <span className="font-['Noto_Sans_Arabic',sans-serif] text-[0.9rem] font-medium mt-1 block">
                        {bilingualContent.form.submit.text.ar}
                      </span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

