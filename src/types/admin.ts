export interface AccessRequest {
  id: number;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
}

export interface User {
  id: string;
  email: string;
  user_type: string;
  created_at: string;
  is_active: boolean;
}

export interface Document {
  id: string;
  title: string;
  description: string;
  preview: string;
  pages: string;
  type: string;
  icon: string;
  slug?: string;
  file_url?: string;
  external_url?: string;
  restricted: boolean;
  file_size?: number;
  mime_type?: string;
  ai_generated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
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
