/**
 * Bilingual Content Support
 * English/Arabic internationalization helper
 */

export interface BilingualText {
  en: string
  ar: string
}

export const bilingualContent = {
  nav: {
    joinAlpha100: {
      en: 'Join Alpha-100',
      ar: 'انضم إلى ألفا-١٠٠',
    },
  },
  hero: {
    badge: {
      en: '100% FREE · Alpha-100 · Limited Spots',
      ar: 'مجاناً ١٠٠٪ · ألفا-١٠٠ · مقاعد محدودة',
    },
    title: {
      en: 'The First AI OS That Rewards You',
      ar: 'أول نظام تشغيل ذكاء اصطناعي يكافئك',
    },
    subtitle: {
      en: 'Where Spirituality Meets Technology · Dual-Agentic Intelligence · Proof-of-Impact Economy',
      ar: 'حيث يلتقي الروحانيات بالتكنولوجيا · ذكاء ثنائي العميل · اقتصاد إثبات التأثير',
    },
    ctaPrimary: {
      en: 'Join Alpha-100 (FREE)',
      ar: 'انضم إلى ألفا-١٠٠ (مجاناً)',
    },
    ctaSecondary: {
      en: 'See the Proof',
      ar: 'شاهد الدليل',
    },
  },
  sections: {
    problem: {
      badge: {
        en: 'The Crisis',
        ar: 'الأزمة',
      },
      title: {
        en: 'The World is in Pain',
        ar: 'العالم يعاني',
      },
      subtitle: {
        en: 'While 305 million people face humanitarian crises, we have the technology to help—but no system to coordinate it.',
        ar: 'بينما يواجه 305 ملايين شخص أزمات إنسانية، لدينا التكنولوجيا للمساعدة - لكن لا يوجد نظام لتنسيقها.',
      },
    },
    solution: {
      badge: {
        en: 'The Solution',
        ar: 'الحل',
      },
      title: {
        en: 'BIZRA OS: AI That Rewards Impact',
        ar: 'بيزرا OS: ذكاء اصطناعي يكافئ التأثير',
      },
      subtitle: {
        en: "The world's first Dual-Agentic Operating System with Proof-of-Impact economy and BlockGraph consensus.",
        ar: 'أول نظام تشغيل ثنائي العميل في العالم مع اقتصاد إثبات التأثير وإجماع BlockGraph.',
      },
    },
    proof: {
      badge: {
        en: 'Verified',
        ar: 'تم التحقق',
      },
      title: {
        en: 'Real Code. Real Tests. Real Impact.',
        ar: 'كود حقيقي. اختبارات حقيقية. تأثير حقيقي.',
      },
      subtitle: {
        en: "We don't just talk about it—we ship it. Here's the proof.",
        ar: 'نحن لا نتحدث فقط عنه - نحن نوصله. هذا هو الدليل.',
      },
    },
    alpha100: {
      badge: {
        en: 'Join Now',
        ar: 'انضم الآن',
      },
      title: {
        en: 'Alpha-100: Be the First',
        ar: 'ألفا-١٠٠: كن الأول',
      },
      subtitle: {
        en: '100 founding members. 100% FREE. Lifetime benefits. Shape the future of AI that rewards humanity.',
        ar: '١٠٠ عضو مؤسس. مجاناً ١٠٠٪. فوائد مدى الحياة. شكل مستقبل الذكاء الاصطناعي الذي يكافئ البشرية.',
      },
    },
  },
  form: {
    invitationCode: {
      label: {
        en: 'Invitation Code',
        ar: 'رمز الدعوة',
      },
      placeholder: {
        en: 'BZ-XXXX-XXXX',
        ar: 'BZ-XXXX-XXXX',
      },
      help: {
        en: 'Enter your exclusive invitation code to proceed',
        ar: 'أدخل رمز الدعوة الحصري الخاص بك للمتابعة',
      },
    },
    name: {
      label: {
        en: 'Full Name',
        ar: 'الاسم الكامل',
      },
    },
    email: {
      label: {
        en: 'Email Address',
        ar: 'البريد الإلكتروني',
      },
    },
    background: {
      label: {
        en: 'Why do you want to join Alpha-100?',
        ar: 'لماذا تريد الانضمام إلى ألفا-١٠٠؟',
      },
      placeholder: {
        en: 'Tell us about your interest in BIZRA and what you hope to contribute...',
        ar: 'أخبرنا عن اهتمامك بـ BIZRA وما تأمل في المساهمة به...',
      },
    },
    submit: {
      text: {
        en: 'Verify Code & Join Alpha-100 (100% FREE)',
        ar: 'تحقق من الرمز وانضم إلى ألفا-١٠٠ (مجاناً ١٠٠٪)',
      },
      submitting: {
        en: 'Submitting...',
        ar: 'جارٍ الإرسال...',
      },
    },
  },
}

/**
 * Render bilingual text component props
 */
export function getBilingualProps(text: BilingualText) {
  return {
    english: text.en,
    arabic: text.ar,
  }
}

