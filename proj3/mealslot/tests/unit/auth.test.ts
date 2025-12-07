import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import * as LoginRoute from "@/app/api/auth/login/route";
import * as SignupRoute from "@/app/api/auth/signup/route";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

function toNextRequest(path: string, method: string, body?: any) {
  const url = new URL(`http://localhost${path}`);
  const init: RequestInit = {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  };
  // @ts-expect-error - Next types aren't perfect in Vitest env
  return new NextRequest(new Request(url, init));
}

describe("Auth API - Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully logs in with valid credentials", async () => {
    const mockUser = {
      id: "1",
      username: "testuser",
      passwordHash: "hashedpassword",
      name: "Test User",
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (bcrypt.compare as any).mockResolvedValue(true);

    const req = toNextRequest("/api/auth/login", "POST", {
      username: "testuser",
      password: "password123",
    });
    const res = await LoginRoute.POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.username).toBe("testuser");
  });

  it("rejects login with invalid username", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const req = toNextRequest("/api/auth/login", "POST", {
      username: "nonexistent",
      password: "password123",
    });
    const res = await LoginRoute.POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("rejects login with invalid password", async () => {
    const mockUser = {
      id: "1",
      username: "testuser",
      passwordHash: "hashedpassword",
      name: "Test User",
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (bcrypt.compare as any).mockResolvedValue(false);

    const req = toNextRequest("/api/auth/login", "POST", {
      username: "testuser",
      password: "wrongpassword",
    });
    const res = await LoginRoute.POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("rejects login with missing username", async () => {
    const req = toNextRequest("/api/auth/login", "POST", {
      password: "password123",
    });
    const res = await LoginRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects login with missing password", async () => {
    const req = toNextRequest("/api/auth/login", "POST", {
      username: "testuser",
    });
    const res = await LoginRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects login with user that has no passwordHash", async () => {
    const mockUser = {
      id: "1",
      username: "testuser",
      passwordHash: null,
      name: "Test User",
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    const req = toNextRequest("/api/auth/login", "POST", {
      username: "testuser",
      password: "password123",
    });
    const res = await LoginRoute.POST(req);
    expect(res.status).toBe(401);
  });

  it("handles empty request body gracefully", async () => {
    const req = toNextRequest("/api/auth/login", "POST", {});
    const res = await LoginRoute.POST(req);
    expect(res.status).toBe(400);
  });
});

describe("Auth API - Signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully creates new user", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue("hashedpassword");
    (prisma.user.create as any).mockResolvedValue({
      id: "1",
      username: "newuser",
      name: "New User",
      email: "newuser@local",
      provider: "local",
    });

    const req = toNextRequest("/api/auth/signup", "POST", {
      username: "newuser",
      password: "password123",
      name: "New User",
    });
    const res = await SignupRoute.POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.username).toBe("newuser");
  });

  it("rejects signup with existing username", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: "1",
      username: "existinguser",
    });

    const req = toNextRequest("/api/auth/signup", "POST", {
      username: "existinguser",
      password: "password123",
    });
    const res = await SignupRoute.POST(req);
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it("rejects signup with username too short", async () => {
    const req = toNextRequest("/api/auth/signup", "POST", {
      username: "ab",
      password: "password123",
    });
    const res = await SignupRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects signup with password too short", async () => {
    const req = toNextRequest("/api/auth/signup", "POST", {
      username: "newuser",
      password: "12345",
    });
    const res = await SignupRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects signup with invalid username characters", async () => {
    const req = toNextRequest("/api/auth/signup", "POST", {
      username: "user@name",
      password: "password123",
    });
    const res = await SignupRoute.POST(req);
    expect(res.status).toBe(400);
  });

  it("creates user without display name", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue("hashedpassword");
    (prisma.user.create as any).mockResolvedValue({
      id: "1",
      username: "newuser",
      name: "newuser",
      email: "newuser@local",
      provider: "local",
    });

    const req = toNextRequest("/api/auth/signup", "POST", {
      username: "newuser",
      password: "password123",
    });
    const res = await SignupRoute.POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("handles database errors gracefully", async () => {
    (prisma.user.findUnique as any).mockRejectedValue(new Error("DB error"));

    const req = toNextRequest("/api/auth/signup", "POST", {
      username: "newuser",
      password: "password123",
    });
    const res = await SignupRoute.POST(req);
    expect(res.status).toBe(500);
  });

  it("validates username length maximum", async () => {
    const req = toNextRequest("/api/auth/signup", "POST", {
      username: "a".repeat(51),
      password: "password123",
    });
    const res = await SignupRoute.POST(req);
    expect(res.status).toBe(400);
  });
});

