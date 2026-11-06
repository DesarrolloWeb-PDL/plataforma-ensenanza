import { eq, sql } from "drizzle-orm";

import {
  badges,
  levelCompletions,
  streaks,
  userBadges,
  userXp,
  xpEvents,
} from "@plataforma/db";
import type { Db } from "@plataforma/db";
import type { Streak as SharedStreak } from "@plataforma/shared";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayUtc(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function awardXp(
  db: Db,
  userId: string,
  amount: number,
  reason: string,
  refType: string,
  refId?: string | null,
): Promise<void> {
  if (amount <= 0) return;
  await db.insert(xpEvents).values({
    userId,
    amount,
    reason,
    refType,
    refId: refId ?? null,
  });
  await db
    .insert(userXp)
    .values({ userId, totalXp: amount, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userXp.userId,
      set: {
        totalXp: sql`${userXp.totalXp} + ${amount}`,
        updatedAt: new Date(),
      },
    });
}

export async function updateStreak(db: Db, userId: string): Promise<SharedStreak> {
  const rows = await db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);
  const existing = rows[0];
  const today = todayUtc();
  const yesterday = yesterdayUtc();

  let current = 1;
  let longest = 1;
  if (existing) {
    if (existing.lastActivityDate === today) {
      current = existing.currentDays;
      longest = existing.longestDays;
    } else if (existing.lastActivityDate === yesterday) {
      current = existing.currentDays + 1;
      longest = Math.max(existing.longestDays, current);
    } else {
      current = 1;
      longest = Math.max(existing.longestDays, 1);
    }
  }

  await db
    .insert(streaks)
    .values({
      userId,
      currentDays: current,
      longestDays: longest,
      lastActivityDate: today,
    })
    .onConflictDoUpdate({
      target: streaks.userId,
      set: {
        currentDays: current,
        longestDays: longest,
        lastActivityDate: today,
      },
    });

  return {
    userId,
    current,
    longest,
    lastActivityDate: today,
  };
}

export async function awardBadges(db: Db, userId: string): Promise<void> {
  const streakRows = await db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);
  const streak = streakRows[0];
  const allBadges = await db.select().from(badges);
  const ownedRows = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const owned = new Set(ownedRows.map((r) => r.badgeId));

  const projectLevels = await db
    .select()
    .from(levelCompletions)
    .where(eq(levelCompletions.studentId, userId));
  const hasProject = projectLevels.some((r) => r.projectSubmissionId !== null);

  for (const badge of allBadges) {
    if (owned.has(badge.id)) continue;
    const criteria = (badge.criteria ?? {}) as Record<string, unknown>;
    let earned = false;
    if (criteria.type === "streak" && typeof criteria.days === "number" && streak) {
      earned = streak.currentDays >= criteria.days;
    } else if (criteria.type === "project_approved" && criteria.count === 1) {
      earned = hasProject;
    }
    if (earned) {
      await db
        .insert(userBadges)
        .values({ userId, badgeId: badge.id, awardedAt: new Date() })
        .onConflictDoNothing();
    }
  }
}

export async function getXpTotal(db: Db, userId: string): Promise<number> {
  const rows = await db.select().from(userXp).where(eq(userXp.userId, userId)).limit(1);
  return rows[0]?.totalXp ?? 0;
}