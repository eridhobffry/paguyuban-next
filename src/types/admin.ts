export interface AccessRequest {
  id: number;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
}

export type UserRole = "member" | "admin" | "super_admin";
export type UserStatus =
  | "pending"
  | "active"
  | "rejected"
  | "disabled"
  | "archived";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  // Authentication hash (internal use only)
  password_hash?: string;
  // Legacy/compat fields
  user_type?: string;
  is_active?: boolean;
  is_super_admin?: boolean;
  // Timestamps for audit-like fields
  requested_at?: string;
  approved_at?: string;
  approved_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  disabled_at?: string;
  disabled_by?: string;
}

export interface DocumentFormData {
  title: string;
  description: string;
  preview: string;
  pages: string;
  type: string;
  icon: string;
  slug: string;
  external_url: string;
  restricted: boolean;
}

export const documentTypes = [
  "Business Strategy",
  "Financial Analysis",
  "Technology",
  "Market Research",
  "Partnership Guide",
  "Technical Specification",
  "Executive Summary",
  "Legal Documentation",
];

export const iconOptions = [
  { value: "FileText", label: "Document" },
  { value: "BarChart3", label: "Analytics" },
  { value: "Zap", label: "Technology" },
  { value: "Users", label: "Research" },
  { value: "TrendingUp", label: "Growth" },
  { value: "Globe", label: "Global" },
  { value: "Target", label: "Strategy" },
  { value: "PieChart", label: "Data" },
];
