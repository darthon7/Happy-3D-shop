import useAuthStore from "./authStore";
import { authApi } from "../api";

// Mock the authApi module
jest.mock("../api", () => ({
  authApi: {
    login: jest.fn(),
    oauth2Login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Clear all mocks and localStorage
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("should have initial empty state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should handle successful login", async () => {
    // Arrange
    const mockUser = { id: 1, email: "test@example.com" };
    const mockResponse = {
      data: {
        access_token: "fake_access_token",
        refresh_token: "fake_refresh_token",
        user: mockUser,
      },
    };

    authApi.login.mockResolvedValueOnce(mockResponse);

    // Act
    const result = await useAuthStore
      .getState()
      .login("test@example.com", "password");

    // Assert
    const state = useAuthStore.getState();

    expect(result.success).toBe(true);
    expect(authApi.login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password",
    });

    // Store assertions
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();

    // LocalStorage assertions
    expect(localStorage.getItem("accessToken")).toBe("fake_access_token");
    expect(localStorage.getItem("refreshToken")).toBe("fake_refresh_token");
  });

  it("should handle failed login", async () => {
    // Arrange
    const mockError = {
      response: {
        data: { message: "Credenciales inválidas" },
      },
    };

    authApi.login.mockRejectedValueOnce(mockError);

    // Act
    const result = await useAuthStore
      .getState()
      .login("wrong@example.com", "wrongpassword");

    // Assert
    const state = useAuthStore.getState();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Credenciales inválidas");

    // Store should remain empty
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Credenciales inválidas");
    expect(state.isLoading).toBe(false);

    // LocalStorage should remain empty
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("should handle successful oauth2Login", async () => {
    // Arrange
    const mockUser = { id: 2, email: "social@example.com", profileImageUrl: "http://example.com/pic.jpg" };
    const mockResponse = {
      data: {
        access_token: "social_access",
        refresh_token: "social_refresh",
        user: mockUser,
      },
    };

    authApi.oauth2Login.mockResolvedValueOnce(mockResponse);

    // Act
    const result = await useAuthStore.getState().oauth2Login("google", "google_token_123");

    // Assert
    const state = useAuthStore.getState();

    expect(result.success).toBe(true);
    expect(authApi.oauth2Login).toHaveBeenCalledWith("google", "google_token_123");

    // Store assertions
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();

    // LocalStorage assertions
    expect(localStorage.getItem("accessToken")).toBe("social_access");
    expect(localStorage.getItem("refreshToken")).toBe("social_refresh");
  });

  it("should handle failed oauth2Login", async () => {
    // Arrange
    const mockError = {
      response: {
        data: { message: "Error validando token de Google" },
      },
    };

    authApi.oauth2Login.mockRejectedValueOnce(mockError);

    // Act
    const result = await useAuthStore.getState().oauth2Login("google", "invalid_token");

    // Assert
    const state = useAuthStore.getState();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error validando token de Google");

    // Store should remain empty
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe("Error validando token de Google");
    expect(state.isLoading).toBe(false);
  });

  it("should handle logout", () => {
    // Arrange
    useAuthStore.setState({ user: { id: 1 }, isAuthenticated: true });

    // Act
    useAuthStore.getState().logout();

    // Assert
    const state = useAuthStore.getState();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("should explicitly set user", () => {
    // Act
    const mockUser = { id: 2, email: "manual@example.com" };
    useAuthStore.getState().setUser(mockUser);

    // Assert
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });
});
