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

export interface Track {
  id: string;
  slug: string;
  name: string;
  ageBand: string;
  order: number;
}

export interface Level {
  id: string;
  trackId: string;
  order: number;
  title: string;
  projectTitle: string;
}

export interface Lesson {
  id: string;
  trackId: string;
  levelId: string;
  order: number;
  title: string;
  mdxRef: string;
}

export const trackSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().min(1),
  ageBand: z.string().min(1),
  order: z.number().int(),
});

export const levelSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  order: z.number().int(),
  title: z.string().min(1),
  projectTitle: z.string().min(1),
});

export const lessonSchema = z.object({
  id: z.string().uuid(),
  trackId: z.string().uuid(),
  levelId: z.string().uuid(),
  order: z.number().int(),
  title: z.string().min(1),
  mdxRef: z.string().min(1),
});

export interface LessonProgress {
  id: string;
  studentId: string;
  lessonId: string;
  completedAt: string;
  xpAwarded: number;
}

export interface LevelCompletion {
  id: string;
  studentId: string;
  levelId: string;
  status: string;
  projectSubmissionId: string | null;
  completedAt: string | null;
  approvedBy: string | null;
}

export const lessonProgressSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  lessonId: z.string().uuid(),
  completedAt: z.string().datetime(),
  xpAwarded: z.number().int().nonnegative(),
});

export const levelCompletionSchema = z.object({
  id: z.string().uuid(),
  studentId: z.string().uuid(),
  levelId: z.string().uuid(),
  status: z.string().min(1),
  projectSubmissionId: z.string().uuid().nullable(),
  completedAt: z.string().datetime().nullable(),
  approvedBy: z.string().uuid().nullable(),
});

export interface RubricCriterion {
  name: string;
  points: number;
  description?: string;
}

export interface Rubric {
  id: string;
  ownerId: string;
  title: string;
  criteria: RubricCriterion[];
  totalPoints: number;
  reusable: boolean;
  createdAt: string;
}

export interface Assignment {
  id: string;
  classId: string;
  lessonId: string | null;
  type: string;
  title: string;
  instructionsMd: string;
  dueAt: string | null;
  maxScore: number;
  rubricId: string | null;
  maxResubmissions: number;
  status: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  version: number;
  status: string;
  payload: unknown;
  submittedAt: string;
  idempotencyKey: string;
}

export interface Grade {
  id: string;
  submissionId: string;
  score: number;
  feedback: string;
  gradedBy: string;
  gradedAt: string;
  rubricScores: unknown;
}

export const rubricCriterionSchema = z.object({
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
  description: z.string().optional(),
});

export const rubricSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  title: z.string().min(1),
  criteria: z.array(rubricCriterionSchema),
  totalPoints: z.number().int().nonnegative(),
  reusable: z.boolean(),
  createdAt: z.string().datetime(),
});

export const assignmentSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  lessonId: z.string().uuid().nullable(),
  type: z.string().min(1),
  title: z.string().min(1),
  instructionsMd: z.string(),
  dueAt: z.string().datetime().nullable(),
  maxScore: z.number().int().nonnegative(),
  rubricId: z.string().uuid().nullable(),
  maxResubmissions: z.number().int().nonnegative(),
  status: z.string().min(1),
  createdAt: z.string().datetime(),
});

export const submissionSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  version: z.number().int().positive(),
  status: z.string().min(1),
  payload: z.unknown(),
  submittedAt: z.string().datetime(),
  idempotencyKey: z.string().min(1),
});

export const gradeSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  score: z.number().int().nonnegative(),
  feedback: z.string(),
  gradedBy: z.string().uuid(),
  gradedAt: z.string().datetime(),
  rubricScores: z.unknown(),
});

export const assignmentCreateSchema = z.object({
  classId: z.string().uuid(),
  lessonId: z.string().uuid().nullable().optional(),
  type: z.enum(["code", "file", "quiz"]).optional(),
  title: z.string().min(1),
  instructionsMd: z.string().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  maxScore: z.number().int().nonnegative().optional(),
  rubricId: z.string().uuid().nullable().optional(),
  maxResubmissions: z.number().int().nonnegative().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const assignmentUpdateSchema = assignmentCreateSchema.partial();

export const submitAssignmentSchema = z.object({
  type: z.enum(["code", "file", "quiz"]),
  content: z.string().optional(),
  fileKey: z.string().optional(),
  answers: z.array(z.unknown()).optional(),
  idempotencyKey: z.string().min(1).optional(),
});

export const gradeSubmissionSchema = z.object({
  score: z.number().int().nonnegative(),
  feedback: z.string().optional(),
  rubricScores: z.record(z.string(), z.number()).optional(),
});

export const signedUploadSchema = z.object({
  key: z.string().min(1).optional(),
  contentType: z.string().min(1).optional(),
});

export interface LiveClass {
  id: string;
  classId: string;
  trackId: string;
  title: string;
  meetingUrl: string;
  provider: string;
  scheduledAt: string;
  durationMin: number;
  recordingUrl?: string | null;
}

export interface Attendance {
  liveClassId: string;
  userId: string;
  joinedAt: string;
}

export const liveClassSchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  trackId: z.string().uuid(),
  title: z.string().min(1),
  meetingUrl: z.string().url(),
  provider: z.string().min(1),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().nonnegative(),
  recordingUrl: z.string().url().nullable().optional(),
});

export const attendanceSchema = z.object({
  liveClassId: z.string().uuid(),
  userId: z.string().uuid(),
  joinedAt: z.string().datetime(),
});

export const liveClassCreateSchema = z.object({
  classId: z.string().uuid(),
  title: z.string().min(1),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().positive(),
  meetingUrl: z.string().url(),
  provider: z.string().min(1).optional(),
  recordingUrl: z.string().url().nullable().optional(),
});

export const liveClassUpdateSchema = liveClassCreateSchema.partial();