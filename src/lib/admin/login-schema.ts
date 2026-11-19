import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z
    .string({ error: "Enter your email address." })
    .trim()
    .max(254, "Email address is too long.")
    .pipe(z.email("Enter a valid email address."))
    .transform((value) => value.toLowerCase()),
  password: z
    .string({ error: "Enter your password." })
    .min(1, "Enter your password.")
    .max(256, "Password is too long."),
});

export type AdminLoginInput = z.input<typeof adminLoginSchema>;
