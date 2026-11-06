import { z } from "zod";

export const ROLES = ["student", "teacher", "parent", "admin"] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  locale: string;
  birthDate: string | null;
  consentStatus: string;
  parentUserId: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role?: Role;
  birthDate?: string | null;
  locale?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface LinkMinorPayload {
  parentId: string;
  childId: string;
  granted?: boolean;
}

export interface RevokeConsentPayload {
  childId: string;
}

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccess<T> {
  data: T;
}

export interface Pagination {
  limit?: number;
  cursor?: string | null;
}

export interface Paginated<T> {
  data: T[];
  nextCursor: string | null;
}

export const roleSchema = z.enum(ROLES);
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: roleSchema.optional(),
  birthDate: z.string().date().nullable().optional(),
  locale: z.string().min(2).optional(),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export const linkMinorSchema = z.object({
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  granted: z.boolean().optional(),
});