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
  firstName: z
    .string()
    .trim()
    .min(1, {
      error: "First name is required",
    })
    .max(50, {
      error: "First name is too long",
    }),

  lastName: z
    .string()
    .trim()
    .min(1, {
      error: "Last name is required",
    })
    .max(50, {
      error: "Last name is too long",
    }),

  email: emailSchema,

  password: passwordSchema,
});

export const resetPasswordSchema = z
  .object({
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
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
