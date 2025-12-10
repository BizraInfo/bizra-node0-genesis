"use client"

import { Button } from "@/components/ui/button"
import { BilingualText } from "./BilingualText"
import { bilingualContent } from "@/lib/i18n"

export function AOSNavigation() {
  return (
    <nav className="fixed top-0 w-full z-[100] bg-[rgba(10,24,40,0.8)] backdrop-blur-[20px] border-b border-[rgba(212,175,55,0.2)]">
      <div className="max-w-[1400px] mx-auto px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start">
            <div className="text-[2rem] font-extrabold text-[#D4AF37] leading-none tracking-[2px]">BIZRA</div>
            <div className="font-['Noto_Sans_Arabic',sans-serif] text-[0.9rem] text-[rgba(255,255,255,0.7)] mt-[0.2rem]">بذرة</div>
          </div>
        </div>
        <a href="#alpha-100">
          <Button className="bg-[#D4AF37] text-[#0A1828] hover:bg-transparent hover:text-[#D4AF37] border-2 border-[#D4AF37] rounded-[50px] px-8 py-2 font-bold transition-all hover:scale-105">
            <BilingualText {...bilingualContent.nav.joinAlpha100} />
          </Button>
        </a>
      </div>
    </nav>
  )
}

