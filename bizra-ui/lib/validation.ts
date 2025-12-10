import { z } from "zod"

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().max(100, "Company name must be less than 100 characters").optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

// Elite founders form validation schema
export const eliteFoundersFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  expertise: z.string().min(5, "Please describe your expertise").max(500, "Expertise description must be less than 500 characters"),
  vision: z.string().min(10, "Please share your vision").max(1000, "Vision must be less than 1000 characters"),
})

export type EliteFoundersFormData = z.infer<typeof eliteFoundersFormSchema>

// Alpha-100 form validation schema
export const alpha100FormSchema = z.object({
  invitation_code: z
    .string()
    .regex(/^BZ-[A-Z0-9]{4}-[A-Z0-9]{4}$/, "Invitation code must match format: BZ-XXXX-XXXX")
    .min(13, "Invitation code is required"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  background: z.string().min(10, "Please tell us about your interest").max(1000, "Background must be less than 1000 characters"),
})

export type Alpha100FormData = z.infer<typeof alpha100FormSchema>

