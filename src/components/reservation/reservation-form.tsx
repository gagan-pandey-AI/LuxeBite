"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  getRestaurantDate,
  reservationFieldNames,
  reservationSchema,
  reservationTimeSlots,
  type ReservationField,
  type ReservationFormInput,
  type ReservationSubmission,
} from "@/lib/reservations/validation";

interface ReservationConfirmation {
  bookingReference: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  status: "pending";
}

interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Partial<Record<ReservationField, string>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readApiError(value: unknown): ApiError | null {
  if (!isRecord(value) || !isRecord(value.error)) {
    return null;
  }

  const { code, message, fieldErrors } = value.error;

  if (typeof code !== "string" || typeof message !== "string") {
    return null;
  }

  const safeFieldErrors: Partial<Record<ReservationField, string>> = {};

  if (isRecord(fieldErrors)) {
    for (const field of reservationFieldNames) {
      const fieldMessage = fieldErrors[field];
      if (typeof fieldMessage === "string") {
        safeFieldErrors[field] = fieldMessage;
      }
    }
  }

  return {
    code,
    message,
    fieldErrors: safeFieldErrors,
  };
}

function readConfirmation(value: unknown): ReservationConfirmation | null {
  if (!isRecord(value) || !isRecord(value.reservation)) {
    return null;
  }

  const reservation = value.reservation;

  if (
    typeof reservation.bookingReference !== "string" ||
    typeof reservation.reservationDate !== "string" ||
    typeof reservation.reservationTime !== "string" ||
    typeof reservation.guestCount !== "number" ||
    reservation.status !== "pending"
  ) {
    return null;
  }

  return {
    bookingReference: reservation.bookingReference,
    reservationDate: reservation.reservationDate,
    reservationTime: reservation.reservationTime,
    guestCount: reservation.guestCount,
    status: "pending",
  };
}

function formatReservationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

function formatReservationTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="reservation-field-error" id={id} role="alert">
      {message}
    </p>
  );
}

export function ReservationForm() {
  const [minimumDate, setMinimumDate] = useState("");
  const [confirmation, setConfirmation] =
    useState<ReservationConfirmation | null>(null);
  const [submitError, setSubmitError] = useState("");
  const shouldReduceMotion = useReducedMotion();
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<
    ReservationFormInput,
    undefined,
    ReservationSubmission
  >({
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      reservationDate: "",
      reservationTime: "",
      guestCount: 2,
      specialRequests: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(reservationSchema),
  });

  useEffect(() => {
    setMinimumDate(getRestaurantDate(new Date()));
  }, []);

  const submitReservation = handleSubmit(async (values) => {
    setSubmitError("");
    clearErrors();

    try {
      const response = await fetch("/api/reservations", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const apiError = readApiError(payload);

        if (apiError?.fieldErrors) {
          for (const field of reservationFieldNames) {
            const message = apiError.fieldErrors[field];
            if (message) {
              setError(field, {
                message,
                type: "server",
              });
            }
          }
        }

        setSubmitError(
          apiError?.message ??
            "We couldn't send your request. Please try again.",
        );
        return;
      }

      const savedReservation = readConfirmation(payload);

      if (!savedReservation) {
        setSubmitError(
          "We couldn't verify your request. Please contact the restaurant before submitting again.",
        );
        return;
      }

      setConfirmation(savedReservation);
    } catch {
      setSubmitError(
        "We couldn't reach the reservation service. Please check your connection and try again.",
      );
    }
  });

  if (confirmation) {
    return (
      <motion.section
        aria-labelledby="reservation-confirmation-title"
        aria-live="polite"
        className="reservation-confirmation"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        role="status"
        transition={{ duration: 0.35 }}
      >
        <span aria-hidden="true" className="reservation-confirmation-icon">
          <Check size={23} />
        </span>
        <span className="eyebrow">Your request is with us</span>
        <h2 id="reservation-confirmation-title">
          Thank you.
          <br />
          <em>Your request is in.</em>
        </h2>
        <p>
          Your request is <strong>pending confirmation</strong>, not a
          confirmed table. Please wait for direct confirmation from the
          restaurant before arriving.
        </p>
        <dl className="reservation-confirmation-details">
          <div>
            <dt>Booking reference</dt>
            <dd>{confirmation.bookingReference}</dd>
          </div>
          <div>
            <dt>Date &amp; time</dt>
            <dd>
              {formatReservationDate(confirmation.reservationDate)} ·{" "}
              {formatReservationTime(confirmation.reservationTime)}
            </dd>
          </div>
          <div>
            <dt>Guests</dt>
            <dd>
              {confirmation.guestCount}{" "}
              {confirmation.guestCount === 1 ? "guest" : "guests"}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd className="reservation-pending-label">Pending confirmation</dd>
          </div>
        </dl>
        <button
          className="reservation-secondary-button"
          onClick={() => {
            setConfirmation(null);
            reset();
          }}
          type="button"
        >
          Make another request
        </button>
      </motion.section>
    );
  }

  return (
    <motion.form
      aria-label="Restaurant reservation request"
      className="reservation-form"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      noValidate
      onSubmit={submitReservation}
      transition={{ duration: 0.45 }}
    >
      <div className="reservation-form-grid">
        <div className="reservation-field">
          <label htmlFor="customerName">Full name</label>
          <input
            autoComplete="name"
            id="customerName"
            maxLength={100}
            {...register("customerName")}
            aria-describedby={errors.customerName ? "customerName-error" : undefined}
            aria-invalid={Boolean(errors.customerName)}
            autoCapitalize="words"
            required
          />
          <FieldError
            id="customerName-error"
            message={errors.customerName?.message}
          />
        </div>

        <div className="reservation-field">
          <label htmlFor="customerEmail">Email address</label>
          <input
            autoComplete="email"
            id="customerEmail"
            maxLength={254}
            {...register("customerEmail")}
            aria-describedby={errors.customerEmail ? "customerEmail-error" : undefined}
            aria-invalid={Boolean(errors.customerEmail)}
            autoCapitalize="none"
            inputMode="email"
            required
            type="email"
          />
          <FieldError
            id="customerEmail-error"
            message={errors.customerEmail?.message}
          />
        </div>

        <div className="reservation-field">
          <label htmlFor="customerPhone">Phone number</label>
          <input
            autoComplete="tel"
            id="customerPhone"
            maxLength={30}
            {...register("customerPhone")}
            aria-describedby={errors.customerPhone ? "customerPhone-error" : undefined}
            aria-invalid={Boolean(errors.customerPhone)}
            inputMode="tel"
            required
            type="tel"
          />
          <FieldError
            id="customerPhone-error"
            message={errors.customerPhone?.message}
          />
        </div>

        <div className="reservation-field">
          <label htmlFor="reservationDate">Reservation date</label>
          <input
            id="reservationDate"
            min={minimumDate}
            {...register("reservationDate")}
            aria-describedby={errors.reservationDate ? "reservationDate-error" : undefined}
            aria-invalid={Boolean(errors.reservationDate)}
            required
            type="date"
          />
          <FieldError
            id="reservationDate-error"
            message={errors.reservationDate?.message}
          />
        </div>

        <div className="reservation-field">
          <label htmlFor="reservationTime">Reservation time</label>
          <select
            id="reservationTime"
            {...register("reservationTime")}
            aria-describedby={errors.reservationTime ? "reservationTime-error" : undefined}
            aria-invalid={Boolean(errors.reservationTime)}
            required
          >
            <option value="">Choose a time</option>
            {reservationTimeSlots.map((time) => (
              <option key={time} value={time}>
                {formatReservationTime(time)}
              </option>
            ))}
          </select>
          <FieldError
            id="reservationTime-error"
            message={errors.reservationTime?.message}
          />
        </div>

        <div className="reservation-field">
          <label htmlFor="guestCount">Number of guests</label>
          <select
            id="guestCount"
            {...register("guestCount", { valueAsNumber: true })}
            aria-describedby={errors.guestCount ? "guestCount-error" : undefined}
            aria-invalid={Boolean(errors.guestCount)}
            required
          >
            {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
          <FieldError
            id="guestCount-error"
            message={errors.guestCount?.message}
          />
        </div>

        <div className="reservation-field reservation-field-wide">
          <label htmlFor="specialRequests">
            Special requests <span>(optional)</span>
          </label>
          <textarea
            id="specialRequests"
            maxLength={1000}
            placeholder="Dietary notes or a little something we should know..."
            rows={4}
            {...register("specialRequests")}
            aria-describedby={errors.specialRequests ? "specialRequests-error" : undefined}
            aria-invalid={Boolean(errors.specialRequests)}
          />
          <FieldError
            id="specialRequests-error"
            message={errors.specialRequests?.message}
          />
        </div>
      </div>

      {submitError && (
        <p className="reservation-submit-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="reservation-form-submit">
        <p>
          Requests remain pending until the restaurant confirms them. This
          request is not a confirmed table.
        </p>
        <button
          className="button reservation-submit-button"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              Sending request
              <LoaderCircle aria-hidden="true" className="reservation-spinner" size={16} />
            </>
          ) : (
            <>
              Request a table <ArrowRight aria-hidden="true" size={15} />
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
