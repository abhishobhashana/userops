import { api } from "./client";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  user: AuthUser;
  requiresMfa?: boolean;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export const authApi = {
  login(input: { email: string; password: string }) {
    return api.post<LoginResponse>("/api/v1/auth/login", input);
  },

  register(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    return api.post<RegisterResponse>("/api/v1/auth/register", input);
  },

  logout() {
    return api.post<void>("/api/v1/auth/logout");
  },

  me() {
    return api.get<MeResponse>("/api/v1/auth/me");
  },
};
