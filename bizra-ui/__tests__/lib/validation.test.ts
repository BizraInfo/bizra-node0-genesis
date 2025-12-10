import { alpha100FormSchema, contactFormSchema, eliteFoundersFormSchema } from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('contactFormSchema', () => {
    it('validates correct contact form data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'ACME Corp',
        message: 'This is a test message',
      }
      expect(() => contactFormSchema.parse(validData)).not.toThrow()
    })

    it('rejects invalid email', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        message: 'Test message',
      }
      expect(() => contactFormSchema.parse(invalidData)).toThrow()
    })

    it('rejects short message', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Short',
      }
      expect(() => contactFormSchema.parse(invalidData)).toThrow()
    })
  })

  describe('alpha100FormSchema', () => {
    it('validates correct invitation code format', () => {
      const validData = {
        invitation_code: 'BZ-N26R-GMDA',
        name: 'John Doe',
        email: 'john@example.com',
        background: 'I want to join because...',
      }
      expect(() => alpha100FormSchema.parse(validData)).not.toThrow()
    })

    it('rejects invalid invitation code format', () => {
      const invalidData = {
        invitation_code: 'INVALID',
        name: 'John Doe',
        email: 'john@example.com',
        background: 'I want to join',
      }
      expect(() => alpha100FormSchema.parse(invalidData)).toThrow()
    })
  })
})

