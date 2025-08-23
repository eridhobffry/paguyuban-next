import { vi } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Test constants
export const TEST_JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-for-testing";
export const TEST_ADMIN_EMAIL = "admin@test.com";
export const TEST_USER_EMAIL = "user@test.com";
export const TEST_PASSWORD = "testpassword123";

// Mock data
export const mockAdminUser = {
  id: "test-admin-user",
  email: TEST_ADMIN_EMAIL,
  name: "Test Admin",
  role: "admin",
};

export const mockRegularUser = {
  id: "test-regular-user",
  email: TEST_USER_EMAIL,
  name: "Test User",
  role: "user",
};

export const mockRequest = (
  options: {
    method?: string;
    url?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
) => {
  const { method = "GET", url = "/", body, headers = {} } = options;

  return {
    method,
    url,
    json: vi.fn().mockResolvedValue(body || {}),
    headers: {
      get: (key: string) => headers[key] || null,
    },
    ...options,
  } as any;
};

export const mockResponse = () => {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return response as any;
};

// Authentication helpers
export const generateTestToken = (payload: any = mockAdminUser): string => {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: "1h" });
};

export const generateExpiredToken = (payload: any = mockAdminUser): string => {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: "-1h" });
};

export const generateMalformedToken = (): string => {
  return "malformed.jwt.token";
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Database helpers
export const createTestUser = async (
  overrides: Partial<typeof mockAdminUser> = {}
) => {
  return { ...mockAdminUser, ...overrides };
};

export const createTestKnowledge = (overrides: any = {}) => {
  return {
    id: "test-knowledge-1",
    title: "Test Knowledge",
    content: "Test content for knowledge system",
    category: "test",
    tags: ["test"],
    overlay: { test: "data" },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

export const createTestAnalytics = (overrides: any = {}) => {
  return {
    id: "test-analytics-1",
    eventType: "page_view",
    page: "/test",
    userAgent: "Test Browser",
    ipAddress: "127.0.0.1",
    timestamp: new Date(),
    metadata: {},
    createdAt: new Date(),
    ...overrides,
  };
};

// API helpers
export const createAuthenticatedRequest = (
  token?: string,
  options: any = {}
) => {
  const authToken = token || generateTestToken();
  return mockRequest({
    headers: {
      authorization: `Bearer ${authToken}`,
      ...options.headers,
    },
    ...options,
  });
};

export const createAdminRequest = (options: any = {}) => {
  return createAuthenticatedRequest(generateTestToken(mockAdminUser), options);
};

export const createUserRequest = (options: any = {}) => {
  return createAuthenticatedRequest(
    generateTestToken(mockRegularUser),
    options
  );
};

export const createUnauthenticatedRequest = (options: any = {}) => {
  return mockRequest({
    headers: {},
    ...options,
  });
};

// Mock helpers
export const mockAuthModule = (
  options: {
    getServerSession?: any;
    verifyToken?: any;
    isAdminFromToken?: any;
  } = {}
) => {
  const {
    getServerSession = vi.fn(),
    verifyToken = vi.fn(),
    isAdminFromToken = vi.fn(),
  } = options;

  vi.mock("@/lib/auth", () => ({
    getServerSession,
    verifyToken,
    isAdminFromToken,
  }));
};

export const mockAIModule = (
  options: {
    generateResponse?: any;
    analyzeQuery?: any;
  } = {}
) => {
  const {
    generateResponse = vi.fn().mockResolvedValue("Test AI response"),
    analyzeQuery = vi.fn().mockResolvedValue({ insights: [] }),
  } = options;

  vi.mock("@/lib/ai/gemini", () => ({
    generateResponse,
    analyzeQuery,
  }));
};

// Assertion helpers
export const expectSuccessResponse = (
  response: any,
  expectedStatus: number = 200
) => {
  expect(response.status).toHaveBeenCalledWith(expectedStatus);
  expect(response.json).toHaveBeenCalled();
};

export const expectErrorResponse = (
  response: any,
  expectedStatus: number,
  expectedError?: string
) => {
  expect(response.status).toHaveBeenCalledWith(expectedStatus);
  const jsonCall = response.json.mock.calls[0][0];
  if (expectedError) {
    expect(jsonCall.error).toContain(expectedError);
  }
  expect(response.json).toHaveBeenCalled();
};

// Common test data
export const testKnowledgeData = [
  createTestKnowledge({
    id: "test-knowledge-1",
    title: "Event Information",
    content: "Paguyuban Messe 2026 is scheduled for December 1-2, 2026",
    overlay: {
      event: {
        dates: "December 1-2, 2026",
        location: "Arena Berlin, Germany",
        name: "Paguyuban Messe 2026",
      },
      contact: {
        email: "overlay@paguyuban-messe.com",
      },
    },
  }),
  createTestKnowledge({
    id: "test-knowledge-2",
    title: "Sponsorship Details",
    content: "We offer Diamond, Gold, and Silver sponsorship tiers",
    overlay: {
      sponsorship: {
        tiers: ["Diamond", "Gold", "Silver"],
        benefits: ["Logo placement", "Booth space"],
      },
    },
  }),
];

export const testAnalyticsData = [
  createTestAnalytics({
    id: "test-analytics-1",
    eventType: "page_view",
    page: "/speakers",
    metadata: { source: "direct", device: "desktop" },
  }),
  createTestAnalytics({
    id: "test-analytics-2",
    eventType: "sponsor_click",
    page: "/sponsors",
    metadata: { sponsorId: "test-sponsor-1", source: "search" },
  }),
];
