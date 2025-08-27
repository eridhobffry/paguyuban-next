import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { 
  createAIServiceToken, 
  verifyAIServiceToken, 
  createAIServiceHeaders,
  makeAIServiceRequest 
} from '@/lib/ai-auth';

// Mock environment variables
const originalEnv = process.env;

describe('AI Service Authentication', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('createAIServiceToken', () => {
    it('should create a valid JWT token', () => {
      process.env.AI_SERVICE_JWT_SECRET = 'test-secret';
      
      const token = createAIServiceToken();
      expect(token).toBeTruthy();
      
      // Decode token to verify structure
      const decoded = jwt.decode(token, { complete: true });
      expect(decoded).toBeTruthy();
      
      const payload = decoded!.payload as any;
      expect(payload.iss).toBe('paguyuban-next');
      expect(payload.aud).toBe('paguyuban-ai');
      expect(payload.service).toBe('next-to-ai');
      expect(payload.nonce).toBeTruthy();
      expect(payload.exp - payload.iat).toBe(30); // 30 second TTL
    });

    it('should create tokens with unique nonces', () => {
      process.env.AI_SERVICE_JWT_SECRET = 'test-secret';
      
      const token1 = createAIServiceToken();
      const token2 = createAIServiceToken();
      
      const payload1 = jwt.decode(token1) as any;
      const payload2 = jwt.decode(token2) as any;
      
      expect(payload1.nonce).not.toBe(payload2.nonce);
    });

    it('should use development fallback secret when not configured', () => {
      delete process.env.AI_SERVICE_JWT_SECRET;
      process.env.NODE_ENV = 'development';
      
      // Mock console.warn
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const token = createAIServiceToken();
      expect(token).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Using development AI service JWT secret')
      );
      
      consoleSpy.mockRestore();
    });

    it('should throw error in production without secret', () => {
      delete process.env.AI_SERVICE_JWT_SECRET;
      process.env.NODE_ENV = 'production';
      
      expect(() => createAIServiceToken()).toThrow(
        'AI_SERVICE_JWT_SECRET must be configured in production'
      );
    });
  });

  describe('verifyAIServiceToken', () => {
    it('should verify valid tokens', () => {
      const secret = 'test-secret';
      process.env.AI_SERVICE_JWT_SECRET = secret;
      
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: 'paguyuban-next',
        aud: 'paguyuban-ai',
        iat: now,
        exp: now + 30,
        nbf: now - 10,
        nonce: 'test-nonce',
        service: 'next-to-ai'
      };
      
      const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
      const verified = verifyAIServiceToken(token);
      
      expect(verified).toBeTruthy();
      expect(verified!.iss).toBe('paguyuban-next');
      expect(verified!.aud).toBe('paguyuban-ai');
    });

    it('should reject expired tokens', () => {
      const secret = 'test-secret';
      process.env.AI_SERVICE_JWT_SECRET = secret;
      
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: 'paguyuban-next',
        aud: 'paguyuban-ai',
        iat: now - 60,
        exp: now - 30, // Expired 30 seconds ago
        nbf: now - 60,
        nonce: 'test-nonce'
      };
      
      const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
      const verified = verifyAIServiceToken(token);
      
      expect(verified).toBeNull();
    });

    it('should reject tokens with wrong issuer', () => {
      const secret = 'test-secret';
      process.env.AI_SERVICE_JWT_SECRET = secret;
      
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: 'wrong-issuer',
        aud: 'paguyuban-ai',
        iat: now,
        exp: now + 30,
        nbf: now - 10,
        nonce: 'test-nonce'
      };
      
      const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
      const verified = verifyAIServiceToken(token);
      
      expect(verified).toBeNull();
    });

    it('should reject tokens with wrong audience', () => {
      const secret = 'test-secret';
      process.env.AI_SERVICE_JWT_SECRET = secret;
      
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: 'paguyuban-next',
        aud: 'wrong-audience',
        iat: now,
        exp: now + 30,
        nbf: now - 10,
        nonce: 'test-nonce'
      };
      
      const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
      const verified = verifyAIServiceToken(token);
      
      expect(verified).toBeNull();
    });

    it('should reject tokens signed with wrong secret', () => {
      process.env.AI_SERVICE_JWT_SECRET = 'correct-secret';
      
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: 'paguyuban-next',
        aud: 'paguyuban-ai',
        iat: now,
        exp: now + 30,
        nbf: now - 10,
        nonce: 'test-nonce'
      };
      
      const token = jwt.sign(payload, 'wrong-secret', { algorithm: 'HS256' });
      const verified = verifyAIServiceToken(token);
      
      expect(verified).toBeNull();
    });

    it('should reject malformed tokens', () => {
      process.env.AI_SERVICE_JWT_SECRET = 'test-secret';
      
      const verified = verifyAIServiceToken('not-a-jwt-token');
      expect(verified).toBeNull();
    });
  });

  describe('createAIServiceHeaders', () => {
    it('should create headers with JWT token', () => {
      process.env.AI_SERVICE_JWT_SECRET = 'test-secret';
      
      const headers = createAIServiceHeaders();
      
      expect(headers.Authorization).toMatch(/^Bearer .+/);
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['User-Agent']).toBe('paguyuban-next/1.0');
    });

    it('should include additional headers', () => {
      process.env.AI_SERVICE_JWT_SECRET = 'test-secret';
      
      const additionalHeaders = {
        'Custom-Header': 'custom-value',
        'Another-Header': 'another-value'
      };
      
      const headers = createAIServiceHeaders(additionalHeaders);
      
      expect(headers.Authorization).toMatch(/^Bearer .+/);
      expect(headers['Custom-Header']).toBe('custom-value');
      expect(headers['Another-Header']).toBe('another-value');
    });
  });

  describe('makeAIServiceRequest', () => {
    beforeEach(() => {
      process.env.AI_SERVICE_JWT_SECRET = 'test-secret';
      process.env.AI_SERVICE_URL = 'http://localhost:8001';
    });

    it('should make authenticated requests', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: 'success' })
      });
      
      // Mock global fetch
      global.fetch = mockFetch;

      await makeAIServiceRequest('/test-endpoint', {
        method: 'POST',
        body: JSON.stringify({ test: 'data' })
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/test-endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Bearer .+/),
            'Content-Type': 'application/json',
            'User-Agent': 'paguyuban-next/1.0'
          }),
          body: JSON.stringify({ test: 'data' }),
          signal: expect.any(AbortSignal)
        })
      );
    });

    it('should handle custom AI service URL', async () => {
      process.env.AI_SERVICE_URL = 'https://custom-ai-service.com/';
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: 'success' })
      });
      
      global.fetch = mockFetch;

      await makeAIServiceRequest('/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom-ai-service.com/test-endpoint',
        expect.any(Object)
      );
    });

    it('should apply default timeout', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ result: 'success' })
      });
      
      global.fetch = mockFetch;

      await makeAIServiceRequest('/test-endpoint');

      const call = mockFetch.mock.calls[0];
      const options = call[1];
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('Clock skew tolerance', () => {
    it('should handle tokens issued slightly in the future', () => {
      const secret = 'test-secret';
      process.env.AI_SERVICE_JWT_SECRET = secret;
      
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: 'paguyuban-next',
        aud: 'paguyuban-ai',
        iat: now + 5, // Issued 5 seconds in future
        exp: now + 35,
        nbf: now - 10,
        nonce: 'test-nonce'
      };
      
      const token = jwt.sign(payload, secret, { algorithm: 'HS256' });
      const verified = verifyAIServiceToken(token);
      
      expect(verified).toBeTruthy();
    });
  });
});