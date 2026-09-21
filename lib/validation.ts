import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, {
    error: "Email address is required",
  })
  .email({
    error: "Enter a valid email address",
  });

export const passwordSchema = z
  .string()
  .min(8, {
    error: "Password must be at least 8 characters",
  })
  .max(128, {
    error: "Password must be 128 characters or fewer",
  })
  .regex(/[0-9]/, {
    error: "Password must include a number",
  })
  .regex(/[A-Z]/, {
    error: "Password must include an uppercase letter",
  })
  .regex(/[a-z]/, {
    error: "Password must include a lowercase letter",
  });

export const loginSchema = z.object({
  email: emailSchema,

  password: z.string().min(1, {
    error: "Password is required",
  }),
});

export const createAccountSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(2, {
      error: "First name must be at least 2 characters",
    })
    .max(80, {
      error: "First name must be 80 characters or fewer",
    }),

  last_name: z
    .string()
    .trim()
    .min(2, {
      error: "Last name must be at least 2 characters",
    })
    .max(80, {
      error: "Last name must be 80 characters or fewer",
    }),

  email: emailSchema,
  password: passwordSchema,
});

export const recoveryCodeSchema = z.object({
  recoveryCode: z.string().trim().min(1, {
    error: "Recovery code is required",
  }),
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().trim().min(1, {
      error: "Reset token is required",
    }),

    password: passwordSchema,

    confirmPassword: z.string().min(1, {
      error: "Confirm your password",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type RecoveryCodeInput = z.infer<typeof recoveryCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
