import { z } from 'zod';

// Shared by the web forms and the API, so both check input the same way.

/** Accepts 03001234567 or +923001234567 (spaces and dashes allowed). Output: +923001234567 */
export const phoneSchema = z
  .string()
  .transform((s) => s.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(\+92|0)3\d{9}$/, 'Enter a mobile number like 03001234567'))
  .transform((s) => '+92' + s.slice(s.startsWith('+92') ? 3 : 1));

export const signupSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(8, 'Password needs at least 8 characters').max(200),
  shopName: z.string().trim().min(1, 'Enter your shop name').max(80),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1).max(200),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
