/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from "node:crypto";

import {
  assignments,
  badges,
  classes,
  enrollments,
  grades,
  lessonProgress,
  lessons,
  levelCompletions,
  levels,
  parentLinks,
  submissions,
  tracks,
  userBadges,
  users,
  xpEvents,
} from "@plataforma/db";

const ALL_TABLES = [
  users,
  parentLinks,
  tracks,
  levels,
  lessons,
  classes,
  enrollments,
  levelCompletions,
  lessonProgress,
  assignments,
  submissions,
  grades,
  badges,
  userBadges,
  xpEvents,
];

function getStore(store: Map<any, any[]>, table: any) {
  if (!store.has(table)) store.set(table, []);
  return store.get(table)!;
}

function columnName(col: any): string {
  return col?.name ?? String(col);
}

function fillDefaults(table: any, values: any) {
  const row: any = { ...values };
  if (row.id === undefined) row.id = randomUUID();
  const now = new Date();
  for (const key of [
    "createdAt",
    "updatedAt",
    "completedAt",
    "submittedAt",
    "gradedAt",
    "consentGrantedAt",
  ]) {
    if (row[key] === undefined && hasColumn()) row[key] = now;
  }
  return row;
}

function hasColumn(): boolean {
  return true;
}

class SelectBuilder {
  private table: any;
  private condition: any;
  private sortCol: any;
  private limitN: number | null = null;
  private store: Map<any, any[]>;

  constructor(store: Map<any, any[]>) {
    this.store = store;
  }

  from(table: any) {
    this.table = table;
    return this;
  }

  where(cond: any) {
    this.condition = cond;
    return this;
  }

  orderBy(col: any) {
    this.sortCol = col;
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  private resolveRows() {
    let rows = [...getStore(this.store, this.table)];
    if (this.condition) rows = rows.filter((r) => this.condition(r));
    if (this.sortCol) {
      const name = columnName(this.sortCol);
      rows = rows.sort((a, b) => (a?.[name] > b?.[name] ? 1 : a?.[name] < b?.[name] ? -1 : 0));
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    return rows;
  }

  then(resolve: any, reject: any) {
    try {
      resolve(this.resolveRows());
    } catch (e) {
      reject(e);
    }
  }
}

class InsertBuilder {
  private table: any;
  private store: Map<any, any[]>;
  private pending: any[] = [];
  private returningFlag = false;
  private conflict: "none" | "update" | "nothing" = "none";
  private conflictSet: any;
  private conflictTarget: any;

  constructor(table: any, store: Map<any, any[]>) {
    this.table = table;
    this.store = store;
  }

  values(data: any) {
    const arr = Array.isArray(data) ? data : [data];
    this.pending = arr.map((v) => fillDefaults(this.table, v));
    return this;
  }

  returning() {
    this.returningFlag = true;
    return this;
  }

  onConflictDoUpdate(opts: any) {
    this.conflict = "update";
    this.conflictSet = opts?.set;
    this.conflictTarget = opts?.target;
    return this;
  }

  onConflictDoNothing() {
    this.conflict = "nothing";
    return this;
  }

  then(resolve: any, reject: any) {
    try {
      const rows = getStore(this.store, this.table);
      const targetName = this.conflictTarget ? columnName(this.conflictTarget) : null;
      const inserted: any[] = [];
      for (const r of this.pending) {
        if (this.conflict !== "none" && targetName) {
          const existing = rows.find((x) => x?.[targetName] === r?.[targetName]);
          if (existing) {
            if (this.conflict === "update" && this.conflictSet) {
              Object.assign(existing, this.conflictSet);
            }
            if (this.returningFlag) inserted.push(existing);
            continue;
          }
        }
        if (this.conflict === "nothing" && targetName) {
          const existing = rows.find((x) => x?.[targetName] === r?.[targetName]);
          if (existing) {
            if (this.returningFlag) inserted.push(existing);
            continue;
          }
        }
        rows.push(r);
        inserted.push(r);
      }
      resolve(this.returningFlag ? inserted : undefined);
    } catch (e) {
      reject(e);
    }
  }
}

class UpdateBuilder {
  private table: any;
  private store: Map<any, any[]>;
  private setValues: any;
  private condition: any;
  private returningFlag = false;

  constructor(table: any, store: Map<any, any[]>) {
    this.table = table;
    this.store = store;
  }

  set(vals: any) {
    this.setValues = vals;
    return this;
  }

  where(cond: any) {
    this.condition = cond;
    return this;
  }

  returning() {
    this.returningFlag = true;
    return this;
  }

  then(resolve: any, reject: any) {
    try {
      const rows = getStore(this.store, this.table);
      const updated: any[] = [];
      for (const r of rows) {
        if (!this.condition || this.condition(r)) {
          Object.assign(r, this.setValues);
          if (this.returningFlag) updated.push(r);
        }
      }
      resolve(this.returningFlag ? updated : undefined);
    } catch (e) {
      reject(e);
    }
  }
}

class DeleteBuilder {
  private table: any;
  private store: Map<any, any[]>;
  private condition: any;

  constructor(table: any, store: Map<any, any[]>) {
    this.table = table;
    this.store = store;
  }

  where(cond: any) {
    this.condition = cond;
    return this;
  }

  then(resolve: any, reject: any) {
    try {
      const rows = getStore(this.store, this.table);
      const kept = rows.filter((r) => !(this.condition ? this.condition(r) : true));
      this.store.set(this.table, kept);
      resolve(undefined);
    } catch (e) {
      reject(e);
    }
  }
}

export function createFakeDb() {
  const store = new Map<any, any[]>();
  for (const t of ALL_TABLES) store.set(t, []);
  return {
    select: () => new SelectBuilder(store),
    insert: (table: any) => new InsertBuilder(table, store),
    update: (table: any) => new UpdateBuilder(table, store),
    delete: (table: any) => new DeleteBuilder(table, store),
  } as any;
}

export { ALL_TABLES };