import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

interface AIServiceJWTPayload {
  iss: string; // issuer (Next.js service)
  aud: string; // audience (AI service)
  iat: number; // issued at
  exp: number; // expires at
  nbf: number; // not before
  nonce: string; // unique nonce to prevent replay
  service: string; // service identifier
}

/**
 * Creates a JWT token for authenticating Next.js → AI service requests
 * Token TTL: 30 seconds with ±10s clock skew tolerance
 */
export function createAIServiceToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const skewTolerance = 10; // seconds
  
  const payload: AIServiceJWTPayload = {
    iss: 'paguyuban-next',
    aud: 'paguyuban-ai',
    iat: now,
    exp: now + 30, // 30 second TTL
    nbf: now - skewTolerance, // Allow 10s clock skew backwards
    nonce: randomBytes(16).toString('hex'), // Prevent replay attacks
    service: 'next-to-ai',
  };

  const secret = getAIServiceSecret();
  
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    header: {
      typ: 'JWT',
      alg: 'HS256',
    },
  });
}

/**
 * Verifies an AI service JWT token
 */
export function verifyAIServiceToken(token: string): AIServiceJWTPayload | null {
  try {
    const secret = getAIServiceSecret();
    
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: 'paguyuban-next',
      audience: 'paguyuban-ai',
      clockTolerance: 10, // Allow 10s clock skew
    }) as AIServiceJWTPayload;

    return payload;
  } catch (error) {
    console.error('AI service token verification failed:', error);
    return null;
  }
}

/**
 * Gets the AI service JWT secret from environment
 * Falls back to a development secret if not configured
 */
function getAIServiceSecret(): string {
  const secret = process.env.AI_SERVICE_JWT_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AI_SERVICE_JWT_SECRET must be configured in production');
    }
    
    // Development fallback - never use in production
    console.warn('Using development AI service JWT secret. Configure AI_SERVICE_JWT_SECRET for production.');
    return 'dev-secret-ai-service-auth-never-use-in-production';
  }
  
  return secret;
}

/**
 * Creates headers for AI service requests with JWT authentication
 */
export function createAIServiceHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = createAIServiceToken();
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'paguyuban-next/1.0',
    ...additionalHeaders,
  };
}

/**
 * Makes an authenticated request to the AI service
 */
export async function makeAIServiceRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8001";
  const url = `${aiServiceUrl.replace(/\/$/, '')}${endpoint}`;
  
  const headers = createAIServiceHeaders(
    options.headers as Record<string, string> || {}
  );

  return fetch(url, {
    ...options,
    headers,
    // Default timeout of 1.2s as per plan
    signal: options.signal || AbortSignal.timeout(1200),
  });
}