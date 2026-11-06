import type { Db } from "@plataforma/db";
import { and, eq, inArray } from "drizzle-orm";
import { assignments, classes, enrollments } from "@plataforma/db";

type MaybeUser = { id?: string; sub?: string; role?: string } | string | null | undefined;
type MaybeClass = { teacherId?: string; id?: string } | null | undefined;
type MaybeAssignment = {
  classId?: string;
  createdBy?: string | null;
  teacherId?: string;
  class?: MaybeClass;
  cls?: MaybeClass;
} | null | undefined;

function extractUserId(user: MaybeUser): string | undefined {
  if (typeof user === "string") return user;
  if (!user) return undefined;
  return user.sub ?? user.id;
}

function extractRole(user: MaybeUser, role?: string): string | undefined {
  if (role) return role;
  if (typeof user === "string") return undefined;
  return user?.role;
}

function findObject(args: unknown[], predicate: (value: unknown) => boolean): unknown {
  return args.find((value) => value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value) && predicate(value));
}

function findArray(args: unknown[]): unknown[] | undefined {
  return args.find((value) => Array.isArray(value)) as unknown[] | undefined;
}

function findString(args: unknown[], skip?: (value: string) => boolean): string | undefined {
  const strings = args.filter((value): value is string => typeof value === "string");
  if (skip) {
    const picked = strings.find((value) => !skip(value));
    return picked;
  }
  return strings[0];
}

export function isAdminRole(role?: string): boolean {
  return role === "admin";
}

export function teacherOwnsClass(...args: unknown[]): boolean {
  const cls = findObject(args, (value) => "teacherId" in (value as Record<string, unknown>)) as MaybeClass;
  const user = findObject(args, (value) => "role" in (value as Record<string, unknown>) || "sub" in (value as Record<string, unknown>)) as MaybeUser;
  const roleArg = findString(args, (value) => value === extractUserId(user));
  const userId = extractUserId(user) ?? findString(args);
  const role = extractRole(user, roleArg);

  if (!cls) return false;
  if (isAdminRole(role)) return true;
  if (!userId) return false;
  return cls.teacherId === userId;
}

export const ownsClass = teacherOwnsClass;
export const canManageClass = teacherOwnsClass;
export const isClassOwner = teacherOwnsClass;

export function teacherOwnsAssignment(...args: unknown[]): boolean {
  const assignment = findObject(
    args,
    (value) =>
      "classId" in (value as Record<string, unknown>) ||
      "createdBy" in (value as Record<string, unknown>) ||
      "assignmentId" in (value as Record<string, unknown>),
  ) as MaybeAssignment;

  const cls = findObject(args, (value) => "teacherId" in (value as Record<string, unknown>)) as MaybeClass;
  const user = findObject(args, (value) => "role" in (value as Record<string, unknown>) || "sub" in (value as Record<string, unknown>)) as MaybeUser;

  const resolvedClass = cls ?? assignment?.class ?? assignment?.cls ?? (assignment && (assignment as { class?: MaybeClass }).class);
  const userId = extractUserId(user) ?? findString(args);  const role = extractRole(user);

  if (isAdminRole(role)) return true;
  if (!assignment) return false;
  if (assignment.createdBy && userId && assignment.createdBy === userId) return true;
  if (resolvedClass?.teacherId && userId && resolvedClass.teacherId === userId) return true;
  if (assignment.teacherId && userId && assignment.teacherId === userId) return true;
  return false;
}

export const ownsAssignment = teacherOwnsAssignment;
export const canManageAssignment = teacherOwnsAssignment;
export const canGradeAssignment = teacherOwnsAssignment;

export function isEnrolledInClass(...args: unknown[]): boolean {
  const arr = findArray(args);
  const user = findObject(args, (value) => "role" in (value as Record<string, unknown>) || "sub" in (value as Record<string, unknown>)) as MaybeUser;
  const userId = extractUserId(user) ?? findString(args);
  const role = extractRole(user);

  if (isAdminRole(role)) return true;
  if (!userId) return false;

  // Single enrollment record passed in.
  const enrollment = findObject(args, (value) => "userId" in (value as Record<string, unknown>)) as { userId?: string; classId?: string } | undefined;

  if (enrollment && !arr) {

    if (enrollment.userId !== userId) return false;
    const classId = findString(args, (value) => value === userId);

    if (classId && enrollment.classId && enrollment.classId !== classId) return false;
    return true;
  }

  if (arr) {
    const classId = findString(args, (value) => value === userId);
    return arr.some((item) => {
      if (!item || typeof item !== "object") return false;
      const record = item as { userId?: string; user_id?: string; classId?: string; class_id?: string };
      const recordUserId = record.userId ?? record.user_id;
      if (recordUserId !== userId) return false;
      if (classId) {
        const recordClassId = record.classId ?? record.class_id;
        if (recordClassId && recordClassId !== classId) return false;
      }
      return true;
    });
  }

  return false;
}

export const isEnrolled = isEnrolledInClass;
export const studentEnrolled = isEnrolledInClass;
export const isStudentEnrolled = isEnrolledInClass;

// Async DB helpers
export async function fetchClass(db: Db, classId: string) {
  const rows = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  return rows[0] ?? null;
}

export async function fetchAssignmentWithClass(db: Db, assignmentId: string) {
  const assignmentRows = await db.select().from(assignments).where(eq(assignments.id, assignmentId)).limit(1);
  const assignment = assignmentRows[0] ?? null;
  if (!assignment) return { assignment: null, cls: null };
  const cls = await fetchClass(db, assignment.classId);
  return { assignment, cls };
}

export async function checkTeacherOwnsClass(db: Db, classId: string, userId: string, role?: string): Promise<boolean> {
  const cls = await fetchClass(db, classId);
  return teacherOwnsClass(cls, userId, role);
}

export async function checkTeacherOwnsAssignment(db: Db, assignmentId: string, userId: string, role?: string): Promise<boolean> {
  const { assignment, cls } = await fetchAssignmentWithClass(db, assignmentId);
  return teacherOwnsAssignment(assignment, cls, userId, role);
}

export async function checkStudentEnrolled(db: Db, classId: string, userId: string, role?: string): Promise<boolean> {
  if (role === "admin") return true;
  const rows = await db.select().from(enrollments).where(and(eq(enrollments.classId, classId), eq(enrollments.userId, userId))).limit(1);
  return rows.length > 0;
}

export async function checkStudentEnrolledInTrack(db: Db, trackId: string, userId: string, role?: string): Promise<boolean> {
  if (role === "admin") return true;
  const classRows = await db.select().from(classes).where(eq(classes.trackId, trackId));
  const classIds = classRows.map((c) => c.id);
  if (classIds.length === 0) return false;
  const rows = await db.select().from(enrollments).where(and(eq(enrollments.userId, userId), inArray(enrollments.classId, classIds))).limit(1);
  return rows.length > 0;
}

export default {
  teacherOwnsClass,
  ownsClass,
  canManageClass,
  isClassOwner,
  teacherOwnsAssignment,
  ownsAssignment,
  canManageAssignment,
  canGradeAssignment,
  isEnrolledInClass,
  isEnrolled,
  studentEnrolled,
  isStudentEnrolled,
  fetchClass,
  fetchAssignmentWithClass,
  checkTeacherOwnsClass,
  checkTeacherOwnsAssignment,
  checkStudentEnrolled,
  checkStudentEnrolledInTrack,
};