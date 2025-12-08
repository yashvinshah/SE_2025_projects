import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/lib/auth-context";

// Mock fetch
global.fetch = vi.fn();

const TestComponent = () => {
  const { user, login, signup, logout } = useAuth();

  return (
    <div>
      {user ? (
        <div>
          <span data-testid="username">{user.username}</span>
          <button onClick={logout} data-testid="logout">Logout</button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => login("testuser", "password")}
            data-testid="login"
          >
            Login
          </button>
          <button
            onClick={() => signup("newuser", "password", "New User")}
            data-testid="signup"
          >
            Sign Up
          </button>
        </div>
      )}
    </div>
  );
};

describe("Auth Context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("provides user state", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId("login")).toBeInTheDocument();
  });

  it("handles successful login", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: "1", username: "testuser", name: "Test User" },
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId("login"));
    await waitFor(() => {
      expect(screen.getByTestId("username")).toHaveTextContent("testuser");
    });
  });

  it("handles failed login", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        message: "Invalid credentials",
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId("login"));
    await waitFor(() => {
      expect(screen.getByTestId("login")).toBeInTheDocument();
    });
  });

  it("handles logout", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: "1", username: "testuser", name: "Test User" },
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId("login"));
    await waitFor(() => {
      expect(screen.getByTestId("username")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("logout"));
    await waitFor(() => {
      expect(screen.getByTestId("login")).toBeInTheDocument();
    });
  });

  it("handles successful signup", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: "1", username: "newuser", name: "New User" },
      }),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId("signup"));
    await waitFor(() => {
      expect(screen.getByTestId("username")).toHaveTextContent("newuser");
    });
  });

  it("loads user from localStorage on mount", () => {
    const user = { id: "1", username: "saveduser", name: "Saved User" };
    localStorage.setItem("mealslot_user", JSON.stringify(user));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("username")).toHaveTextContent("saveduser");
  });
});

