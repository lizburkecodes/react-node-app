const { z } = require("zod");

// Email validation - RFC 5322 compliant
const emailSchema = z
  .email({ message: "Invalid email address" })
  .min(5, "Email must be at least 5 characters")
  .max(255, "Email must not exceed 255 characters")
  .transform((val) => val.toLowerCase());

// Password validation - minimum 8 characters, supports long passphrases
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(1024, "Password must not exceed 1024 characters");

/**
 * Register validation schema
 * Validates new user registration data
 */
const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Login validation schema
 * Validates user login credentials
 */
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Change password validation schema
 * Validates password change request
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

/**
 * Forgot password validation schema
 * Validates forgot password request
 */
const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password validation schema
 * Validates password reset with token
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Refresh token validation schema
 * Validates token refresh request
 */
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * Logout validation schema
 * Validates logout request
 */
const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  logoutSchema,
};
