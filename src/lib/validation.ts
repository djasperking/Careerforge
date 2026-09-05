import { z } from "zod";

export const emailSchema = z.string().email().max(254).toLowerCase().trim();

export const registerSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  email: emailSchema,
  password: z.string().min(10).max(200),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(10).max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(200),
});

export const verifyEmailSchema = z.object({ token: z.string().min(10) });
