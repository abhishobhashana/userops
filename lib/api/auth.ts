import { api } from "./client";
import type { PublicUser } from "@/lib/auth/types";

export interface LoginResponse {
  user?: PublicUser;
  requiresMfa: boolean;
  mfaToken?: string;
}

export interface RegisterResponse {
  user: PublicUser;
}

export interface MeResponse {
  user: PublicUser;
}

export interface LogoutResponse {
  message: string;
}

export interface MfaVerifyResponse {
  user: PublicUser;
}

export const authApi = {
  login(input: { email: string; password: string }) {
    return api.post<LoginResponse>("/api/v1/auth/login", input);
  },

  register(input: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) {
    return api.post<RegisterResponse>("/api/v1/auth/register", input);
  },

  logout() {
    return api.post<LogoutResponse>("/api/v1/auth/logout");
  },

  me() {
    return api.get<MeResponse>("/api/v1/auth/me");
  },

  verifyMfa(input: { mfaToken: string; code: string }) {
    return api.post<MfaVerifyResponse>("/api/v1/auth/mfa/verify", input);
  },
};
