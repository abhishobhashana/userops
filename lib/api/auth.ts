import type { PublicUser } from "@/lib/auth/types";

import { api } from "./client";

export interface LoginResponse {
  user: PublicUser;
}

export interface RegisterResponse {
  user: PublicUser;
  recoveryCode: string;
}

export interface MeResponse {
  user: PublicUser;
}

export interface LogoutResponse {
  message: string;
}

export interface VerifyRecoveryCodeResponse {
  resetToken: string;
}

export interface ResetPasswordResponse {
  message: string;
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

  verifyRecoveryCode(input: { recoveryCode: string }) {
    return api.post<VerifyRecoveryCodeResponse>(
      "/api/v1/auth/forgot-password",
      input,
    );
  },

  resetPassword(input: {
    resetToken: string;
    password: string;
    confirmPassword: string;
  }) {
    return api.post<ResetPasswordResponse>(
      "/api/v1/auth/reset-password",
      input,
    );
  },
};
