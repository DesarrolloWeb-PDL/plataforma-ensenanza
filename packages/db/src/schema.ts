import {
  AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["student", "teacher", "parent", "admin"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    role: userRole("role").notNull().default("student"),
    locale: text("locale").notNull().default("es"),
    birthDate: date("birth_date"),
    passwordHash: text("password_hash"),
    consentStatus: text("consent_status").notNull().default("pending"),
    parentUserId: uuid("parent_user_id").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

export const parentLinks = pgTable(
  "parent_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    childId: uuid("child_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    consentGrantedAt: timestamp("consent_granted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("parent_links_pair_uq").on(t.parentId, t.childId)],
);

export const tracks = pgTable("tracks", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  ageBand: text("age_band").notNull(),
  order: integer("order").notNull(),
});

export const levels = pgTable(
  "levels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackId: uuid("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    title: text("title").notNull(),
    projectTitle: text("project_title").notNull(),
  },
  (t) => [uniqueIndex("levels_track_order_uq").on(t.trackId, t.order)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    trackId: uuid("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
    levelId: uuid("level_id").notNull().references(() => levels.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    title: text("title").notNull(),
    mdxRef: text("mdx_ref").notNull(),
  },
  (t) => [index("lessons_track_level_order_idx").on(t.trackId, t.levelId, t.order)],
);

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    trackId: uuid("track_id").notNull().references(() => tracks.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("classes_teacher_idx").on(t.teacherId)],
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("student"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("enrollments_class_user_uq").on(t.classId, t.userId)],
);

export const levelCompletions = pgTable(
  "level_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    levelId: uuid("level_id").notNull().references(() => levels.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    projectSubmissionId: uuid("project_submission_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [uniqueIndex("level_completions_student_level_uq").on(t.studentId, t.levelId)],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    xpAwarded: integer("xp_awarded").notNull().default(0),
  },
  (t) => [uniqueIndex("lesson_progress_student_lesson_uq").on(t.studentId, t.lessonId)],
);

export const liveSessions = pgTable(
  "live_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    joinUrl: text("join_url").notNull(),
    recordingUrl: text("recording_url"),
    recordingExpiresAt: timestamp("recording_expires_at", { withTimezone: true }),
    status: text("status").notNull().default("scheduled"),
  },
  (t) => [index("live_sessions_class_start_idx").on(t.classId, t.startsAt)],
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    liveSessionId: uuid("live_session_id").notNull().references(() => liveSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("absent"),
    markedBy: uuid("marked_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("attendance_session_student_uq").on(t.liveSessionId, t.studentId)],
);

export const rubrics = pgTable(
  "rubrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    criteria: jsonb("criteria").notNull().default([]),
    totalPoints: integer("total_points").notNull().default(0),
    reusable: boolean("reusable").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rubrics_owner_idx").on(t.ownerId)],
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
    type: text("type").notNull().default("code"),
    title: text("title").notNull(),
    instructionsMd: text("instructions_md").notNull().default(""),
    dueAt: timestamp("due_at", { withTimezone: true }),
    maxScore: integer("max_score").notNull().default(100),
    rubricId: uuid("rubric_id").references(() => rubrics.id, { onDelete: "set null" }),
    maxResubmissions: integer("max_resubmissions").notNull().default(2),
    status: text("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("assignments_class_due_status_idx").on(t.classId, t.dueAt, t.status)],
);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assignmentId: uuid("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    status: text("status").notNull().default("submitted"),
    payload: jsonb("payload").notNull().default({}),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
  },
  (t) => [
    uniqueIndex("submissions_assignment_student_version_uq").on(t.assignmentId, t.studentId, t.version),
    index("submissions_assignment_idx").on(t.assignmentId),
  ],
);

export const grades = pgTable("grades", {
  id: uuid("id").defaultRandom().primaryKey(),
  submissionId: uuid("submission_id").notNull().unique().references(() => submissions.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  feedback: text("feedback").notNull().default(""),
  gradedBy: uuid("graded_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  gradedAt: timestamp("graded_at", { withTimezone: true }).notNull().defaultNow(),
  rubricScores: jsonb("rubric_scores").notNull().default({}),
});

export const fileAssets = pgTable(
  "file_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storageKey: text("storage_key").notNull().unique(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    visibility: text("visibility").notNull().default("private"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("file_assets_owner_idx").on(t.ownerUserId)],
);

export const worksheets = pgTable(
  "worksheets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
    trackId: uuid("track_id").references(() => tracks.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    fileKey: text("file_key").notNull(),
    answerKeyFileKey: text("answer_key_file_key"),
    printable: boolean("printable").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("worksheets_track_idx").on(t.trackId)],
);

export const badges = pgTable("badges", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  criteria: jsonb("criteria").notNull().default({}),
  trackId: uuid("track_id").references(() => tracks.id, { onDelete: "set null" }),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id").notNull().references(() => badges.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("user_badges_user_badge_uq").on(t.userId, t.badgeId)],
);

export const xpEvents = pgTable(
  "xp_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    refType: text("ref_type").notNull(),
    refId: uuid("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("xp_events_user_created_idx").on(t.userId, t.createdAt)],
);

export const streaks = pgTable("streaks", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  currentDays: integer("current_days").notNull().default(0),
  longestDays: integer("longest_days").notNull().default(0),
  lastActivityDate: date("last_activity_date"),
});