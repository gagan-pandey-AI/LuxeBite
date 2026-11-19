import { z } from "zod";

const restaurantTimeZone = "America/New_York";
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:(?:17|18|19|20|21):(?:00|30)|22:00)$/;

export const reservationFieldNames = [
  "customerName",
  "customerEmail",
  "customerPhone",
  "reservationDate",
  "reservationTime",
  "guestCount",
  "specialRequests",
] as const;
export type ReservationField = (typeof reservationFieldNames)[number];

function isValidISODate(value: string) {
  if (!isoDatePattern.test(value)) {
    return false;
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

export function getRestaurantDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: restaurantTimeZone,
    year: "numeric",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export const reservationTimeSlots = Array.from({ length: 11 }, (_, index) => {
  const totalMinutes = 17 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

export function createReservationSchema(now: () => Date = () => new Date()) {
  return z
    .object({
      customerName: z
        .string({ error: "Enter your full name." })
        .trim()
        .min(2, "Enter your full name.")
        .max(100, "Your name must be 100 characters or fewer."),
      customerEmail: z
        .string({ error: "Enter your email address." })
        .trim()
        .max(254, "Enter an email address under 255 characters.")
        .pipe(z.email("Enter a valid email address."))
        .transform((value) => value.toLowerCase()),
      customerPhone: z
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
      reservationDate: z
        .string({ error: "Choose a reservation date." })
        .refine(isValidISODate, "Choose a valid reservation date."),
      reservationTime: z
        .string({ error: "Choose a reservation time." })
        .regex(timePattern, "Choose a time between 5:00 PM and 10:00 PM."),
      guestCount: z
        .number({ error: "Choose the number of guests." })
        .refine(Number.isInteger, "Choose a whole number of guests.")
        .min(1, "Reservations must be for at least 1 guest.")
        .max(8, "Online reservations are limited to 8 guests."),
      specialRequests: z
        .string()
        .trim()
        .max(1000, "Special requests must be 1,000 characters or fewer.")
        .optional()
        .transform((value) => value || null),
    })
    .superRefine((reservation, context) => {
      if (!isValidISODate(reservation.reservationDate)) {
        return;
      }

      const currentTime = now();
      const today = getRestaurantDate(currentTime);

      if (reservation.reservationDate < today) {
        context.addIssue({
          code: "custom",
          message: "Choose today or a future date.",
          path: ["reservationDate"],
        });
        return;
      }

      const weekday = new Date(
        `${reservation.reservationDate}T00:00:00.000Z`,
      ).getUTCDay();

      if (weekday === 1) {
        context.addIssue({
          code: "custom",
          message: "The restaurant is closed on Mondays.",
          path: ["reservationDate"],
        });
      }

      if (
        reservation.reservationDate === today &&
        timePattern.test(reservation.reservationTime)
      ) {
        const parts = new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          hourCycle: "h23",
          minute: "2-digit",
          timeZone: restaurantTimeZone,
        }).formatToParts(currentTime);
        const values = Object.fromEntries(
          parts.map(({ type, value }) => [type, value]),
        );
        const currentMinutes =
          Number(values.hour) * 60 + Number(values.minute);
        const [hours, minutes] = reservation.reservationTime
          .split(":")
          .map(Number);

        if (hours * 60 + minutes <= currentMinutes) {
          context.addIssue({
            code: "custom",
            message: "Choose a time later than now.",
            path: ["reservationTime"],
          });
        }
      }
    });
}

export const reservationSchema = createReservationSchema();
export type ReservationFormInput = z.input<typeof reservationSchema>;
export type ReservationSubmission = z.output<typeof reservationSchema>;
