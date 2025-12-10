/**
 * @test Validation Service Unit Tests
 * @description Tests for validation rules and input sanitization
 * @coverage >95% - All validation rules and edge cases
 */
import { ValidationService } from '@/services/validation.service';
import { validationRules, validInputs, invalidInputs, edgeCases } from '@tests/fixtures/validation.fixture';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = new ValidationService();
  });

  describe('Email Validation', () => {
    it('should validate correct email formats', () => {
      validInputs.email.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      invalidInputs.email.forEach(email => {
        expect(validationService.validateEmail(email)).toBe(false);
      });
    });

    it('should handle email with special characters', () => {
      expect(validationService.validateEmail('test+tag@example.com')).toBe(true);
      expect(validationService.validateEmail('first.last@example.co.uk')).toBe(true);
    });

    it('should reject emails with spaces', () => {
      expect(validationService.validateEmail('test @example.com')).toBe(false);
      expect(validationService.validateEmail('test@ example.com')).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      validInputs.password.forEach(password => {
        expect(validationService.validatePassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      invalidInputs.password.forEach(password => {
        expect(validationService.validatePassword(password)).toBe(false);
      });
    });

    it('should enforce minimum length', () => {
      expect(validationService.validatePassword('Short1!')).toBe(false);
      expect(validationService.validatePassword('LongEnough1!')).toBe(true);
    });

    it('should require uppercase letters', () => {
      expect(validationService.validatePassword('nocapital123!')).toBe(false);
      expect(validationService.validatePassword('HasCapital123!')).toBe(true);
    });

    it('should require lowercase letters', () => {
      expect(validationService.validatePassword('NOLOWER123!')).toBe(false);
      expect(validationService.validatePassword('HasLower123!')).toBe(true);
    });

    it('should require numbers', () => {
      expect(validationService.validatePassword('NoNumbers!')).toBe(false);
      expect(validationService.validatePassword('HasNumbers1!')).toBe(true);
    });

    it('should require special characters', () => {
      expect(validationService.validatePassword('NoSpecial123')).toBe(false);
      expect(validationService.validatePassword('HasSpecial123!')).toBe(true);
    });
  });

  describe('Username Validation', () => {
    it('should validate correct usernames', () => {
      validInputs.username.forEach(username => {
        expect(validationService.validateUsername(username)).toBe(true);
      });
    });

    it('should reject invalid usernames', () => {
      invalidInputs.username.forEach(username => {
        expect(validationService.validateUsername(username)).toBe(false);
      });
    });

    it('should enforce length constraints', () => {
      expect(validationService.validateUsername('ab')).toBe(false); // Too short
      expect(validationService.validateUsername('a'.repeat(51))).toBe(false); // Too long
      expect(validationService.validateUsername('validuser')).toBe(true);
    });

    it('should allow hyphens and underscores', () => {
      expect(validationService.validateUsername('test-user')).toBe(true);
      expect(validationService.validateUsername('test_user')).toBe(true);
    });

    it('should reject special characters', () => {
      expect(validationService.validateUsername('test@user')).toBe(false);
      expect(validationService.validateUsername('test!user')).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      validInputs.url.forEach(url => {
        expect(validationService.validateUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      invalidInputs.url.forEach(url => {
        expect(validationService.validateUrl(url)).toBe(false);
      });
    });

    it('should require http or https protocol', () => {
      expect(validationService.validateUrl('http://example.com')).toBe(true);
      expect(validationService.validateUrl('https://example.com')).toBe(true);
      expect(validationService.validateUrl('ftp://example.com')).toBe(false);
    });

    it('should handle URLs with paths and query strings', () => {
      expect(validationService.validateUrl('https://example.com/path')).toBe(true);
      expect(validationService.validateUrl('https://example.com?query=value')).toBe(true);
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate E.164 format', () => {
      validInputs.phoneNumber.forEach(phone => {
        expect(validationService.validatePhoneNumber(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      invalidInputs.phoneNumber.forEach(phone => {
        expect(validationService.validatePhoneNumber(phone)).toBe(false);
      });
    });

    it('should handle international formats', () => {
      expect(validationService.validatePhoneNumber('+14155552671')).toBe(true); // US
      expect(validationService.validatePhoneNumber('+442071838750')).toBe(true); // UK
      expect(validationService.validatePhoneNumber('+81312345678')).toBe(true); // Japan
    });
  });

  describe('Sanitization', () => {
    it('should remove SQL injection attempts', () => {
      const malicious = edgeCases.specialCharacters.sqlInjection;
      const sanitized = validationService.sanitize(malicious);

      expect(sanitized).not.toContain('DROP TABLE');
      expect(sanitized).not.toContain('--');
    });

    it('should escape XSS attempts', () => {
      const xss = edgeCases.specialCharacters.xss;
      const sanitized = validationService.sanitize(xss);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });

    it('should handle path traversal attempts', () => {
      const pathTraversal = edgeCases.specialCharacters.pathTraversal;
      const sanitized = validationService.sanitize(pathTraversal);

      expect(sanitized).not.toContain('../');
    });

    it('should trim whitespace', () => {
      expect(validationService.sanitize('  test  ')).toBe('test');
      expect(validationService.sanitize('\ttest\n')).toBe('test');
    });

    it('should preserve valid special characters', () => {
      const valid = 'test@example.com';
      expect(validationService.sanitize(valid)).toBe(valid);
    });
  });

  describe('Complex Validation', () => {
    it('should validate multiple fields', () => {
      const data = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'SecurePass123!',
      };

      const result = validationService.validateObject(data, {
        email: { type: 'email', required: true },
        username: { type: 'username', required: true },
        password: { type: 'password', required: true },
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect multiple validation errors', () => {
      const data = {
        email: 'invalid-email',
        username: 'a',
        password: '123',
      };

      const result = validationService.validateObject(data, {
        email: { type: 'email', required: true },
        username: { type: 'username', required: true },
        password: { type: 'password', required: true },
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result).toHaveValidationError('email');
      expect(result).toHaveValidationError('username');
      expect(result).toHaveValidationError('password');
    });

    it('should validate nested objects', () => {
      const data = {
        user: {
          email: 'test@example.com',
          profile: {
            website: 'https://example.com',
          },
        },
      };

      const result = validationService.validateObject(data, {
        'user.email': { type: 'email', required: true },
        'user.profile.website': { type: 'url', required: false },
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined', () => {
      expect(validationService.validateEmail(null)).toBe(false);
      expect(validationService.validateEmail(undefined)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(validationService.validateEmail('')).toBe(false);
      expect(validationService.validatePassword('')).toBe(false);
    });

    it('should handle very long inputs', () => {
      const longString = 'a'.repeat(10000);
      expect(() => validationService.sanitize(longString)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      expect(validationService.sanitize('测试')).toBe('测试');
      expect(validationService.sanitize('тест')).toBe('тест');
    });

    it('should handle emoji', () => {
      const emoji = edgeCases.specialCharacters.emoji;
      expect(() => validationService.sanitize(emoji)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should validate email in under 1ms', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        validationService.validateEmail('test@example.com');
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // 1000 validations in <100ms
    });

    it('should sanitize large strings efficiently', () => {
      const largeString = 'test '.repeat(10000);

      const start = performance.now();
      validationService.sanitize(largeString);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
    });
  });
});
