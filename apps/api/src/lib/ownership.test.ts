import { describe, expect, it } from "vitest";

import { teacherOwnsClass, teacherOwnsAssignment, isEnrolledInClass } from "./ownership";

describe("ownership helper", () => {
  it("detects teacher class ownership", () => {
    const cls = { id: "c1", teacherId: "t1" };
    expect(teacherOwnsClass(cls, "t1")).toBe(true);
    expect(teacherOwnsClass(cls, "t2")).toBe(false);
    expect(teacherOwnsClass(cls, "admin", "admin")).toBe(true);
  });

  it("detects assignment ownership via class or createdBy", () => {
    const assignment = { id: "a1", classId: "c1", createdBy: "t2" };
    const cls = { id: "c1", teacherId: "t1" };
    expect(teacherOwnsAssignment(assignment, cls, "t1")).toBe(true);
    expect(teacherOwnsAssignment(assignment, null, "t2")).toBe(true);
    expect(teacherOwnsAssignment(assignment, cls, "t3")).toBe(false);
  });

  it("detects student enrollment", () => {
    const enrollments = [
      { userId: "s1", classId: "c1" },
      { userId: "s2", classId: "c2" },
    ];
    expect(isEnrolledInClass(enrollments, "s1", "c1")).toBe(true);
    expect(isEnrolledInClass(enrollments, "s1", "c2")).toBe(false);
    expect(isEnrolledInClass({ userId: "s1", classId: "c1" }, "s1")).toBe(true);
  });
});