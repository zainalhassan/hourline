import { describe, expect, it } from "vitest";
import {
  createItemSchema,
  createPipelineSchema,
  loginSchema,
  registerSchema,
} from "@/lib/validations";

describe("validations", () => {
  it("validates register input", () => {
    const result = registerSchema.safeParse({
      name: "Demo",
      email: "demo@test.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords on register", () => {
    const result = registerSchema.safeParse({
      name: "Demo",
      email: "demo@test.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("validates login input", () => {
    const result = loginSchema.safeParse({
      email: "demo@test.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("validates pipeline name", () => {
    expect(createPipelineSchema.safeParse({ name: "My Pipeline" }).success).toBe(true);
    expect(createPipelineSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("validates item title", () => {
    expect(createItemSchema.safeParse({ title: "Acme role" }).success).toBe(true);
    expect(createItemSchema.safeParse({ title: "" }).success).toBe(false);
  });
});
