import { z } from "zod";

export const contactFieldNames = [
  "name",
  "email",
  "phone",
  "subject",
  "message",
] as const;
export type ContactField = (typeof contactFieldNames)[number];

export const contactSchema = z.object({
  name: z
    .string({ error: "Enter your full name." })
    .trim()
    .min(2, "Enter your full name.")
    .max(100, "Your name must be 100 characters or fewer."),
  email: z
    .string({ error: "Enter your email address." })
    .trim()
    .max(254, "Enter an email address under 255 characters.")
    .pipe(z.email("Enter a valid email address."))
    .transform((value) => value.toLowerCase()),
  phone: z
    .string({ error: "Enter your phone number." })
    .trim()
    .max(30, "Enter a phone number under 31 characters.")
    .refine(
      (value) =>
        /^[+0-9(). -]+$/.test(value) &&
        value.replace(/\D/g, "").length >= 7 &&
        value.replace(/\D/g, "").length <= 20,
      "Enter a valid phone number with 7 to 20 digits.",
    ),
  subject: z
    .string({ error: "Enter a subject." })
    .trim()
    .min(3, "Your subject must be at least 3 characters.")
    .max(120, "Your subject must be 120 characters or fewer."),
  message: z
    .string({ error: "Enter a message." })
    .trim()
    .min(10, "Your message must be at least 10 characters.")
    .max(3000, "Your message must be 3,000 characters or fewer."),
});

export type ContactFormInput = z.input<typeof contactSchema>;
export type ContactSubmission = z.output<typeof contactSchema>;
