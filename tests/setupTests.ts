import "@testing-library/jest-dom";
import { execSync } from "child_process";
import path from "path";
import { vi } from "vitest";

// Environment variables are now set in vitest.config.ts
// This ensures consistent test environment across all test files

// Mock external services
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(),
  verifyToken: vi.fn(),
  isAdminFromToken: vi.fn(),
}));

// Mock AI services
vi.mock("@/lib/ai/gemini", () => ({
  generateResponse: vi.fn(),
  analyzeQuery: vi.fn(),
}));

// Setup global test utilities
global.beforeAll(async () => {
  console.log("🚀 Setting up test environment...");
  console.log("Environment variables loaded:");
  console.log("- NODE_ENV:", process.env.NODE_ENV);
  console.log(
    "- DATABASE_URL:",
    process.env.DATABASE_URL ? "✅ Set" : "❌ Not set"
  );
  console.log(
    "- JWT_SECRET:",
    process.env.JWT_SECRET ? "✅ Set" : "❌ Not set"
  );
});

global.afterAll(async () => {
  console.log("🧹 Cleaning up test environment...");
  // Add any cleanup logic here if needed
});
