import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserByEmail, createUser, type User } from "./sql";
import { SUPER_ADMIN_EMAIL } from "./constants";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || SUPER_ADMIN_EMAIL;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      user_type: user.user_type,
      is_super_admin: user.is_super_admin === true,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) return null;

  return user;
}

export async function initializeAdmin(): Promise<void> {
  const adminEmail = ADMIN_EMAIL;
  const adminPassword = "Aabbcc1!";

  try {
    const existingAdmin = await getUserByEmail(adminEmail);
    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminPassword);
      await createUser(adminEmail, hashedPassword, "admin");
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error initializing admin:", error);
  }
}

export function isAdmin(user: User): boolean {
  return !!user && (user.role === "admin" || user.role === "super_admin");
}

export function isSuperAdmin(user: User): boolean {
  return !!user && user.is_super_admin === true;
}
