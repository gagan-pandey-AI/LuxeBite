"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  contactFieldNames,
  contactSchema,
  type ContactField,
  type ContactFormInput,
  type ContactSubmission,
} from "@/lib/contact/validation";

interface ApiError {
  message: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readApiError(value: unknown): ApiError | null {
  if (!isRecord(value) || !isRecord(value.error)) {
    return null;
  }

  const { message, fieldErrors } = value.error;

  if (typeof message !== "string") {
    return null;
  }

  const safeFieldErrors: Partial<Record<ContactField, string>> = {};

  if (isRecord(fieldErrors)) {
    for (const field of contactFieldNames) {
      const fieldMessage = fieldErrors[field];
      if (typeof fieldMessage === "string") {
        safeFieldErrors[field] = fieldMessage;
      }
    }
  }

  return { message, fieldErrors: safeFieldErrors };
}

function hasReceivedMessage(value: unknown) {
  return (
    isRecord(value) &&
    isRecord(value.contactMessage) &&
    value.contactMessage.received === true &&
    value.contactMessage.status === "new"
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="contact-field-error" id={id} role="alert">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const shouldReduceMotion = useReducedMotion();
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ContactFormInput, undefined, ContactSubmission>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(contactSchema),
  });

  const submitContactMessage = handleSubmit(async (values) => {
    setSubmitError("");
    clearErrors();

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const apiError = readApiError(payload);

        if (apiError?.fieldErrors) {
          for (const field of contactFieldNames) {
            const message = apiError.fieldErrors[field];
            if (message) {
              setError(field, { message, type: "server" });
            }
          }
        }

        setSubmitError(
          apiError?.message ??
            "We couldn't send your message. Please try again.",
        );
        return;
      }

      if (!hasReceivedMessage(payload)) {
        setSubmitError(
          "We couldn't verify that your message was received. Please try again later.",
        );
        return;
      }

      reset();
      setSubmitted(true);
    } catch {
      setSubmitError(
        "We couldn't reach the contact service. Please check your connection and try again.",
      );
    }
  });

  if (submitted) {
    return (
      <motion.section
        aria-labelledby="contact-success-title"
        aria-live="polite"
        className="contact-success"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        role="status"
        transition={{ duration: 0.35 }}
      >
        <span aria-hidden="true" className="contact-success-icon">
          <Check size={22} />
        </span>
        <span className="eyebrow">A note, safely received</span>
        <h3 id="contact-success-title">
          Thank you.
          <br />
          <em>Your message is with us.</em>
        </h3>
        <p>
          Your message was saved to the contact inbox. This concept form does
          not send an automatic reply, and the contact details on this page are
          fictional demonstration information.
        </p>
        <button
          className="contact-send-another"
          onClick={() => setSubmitted(false)}
          type="button"
        >
          Send another message
        </button>
      </motion.section>
    );
  }

  return (
    <motion.form
      aria-label="Contact message form"
      className="contact-form"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      noValidate
      onSubmit={submitContactMessage}
      transition={{ duration: 0.45 }}
    >
      <div className="contact-form-grid">
        <div className="contact-field">
          <label htmlFor="contact-name">Full name</label>
          <input
            autoComplete="name"
            id="contact-name"
            maxLength={100}
            {...register("name")}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            aria-invalid={Boolean(errors.name)}
            required
            type="text"
          />
          <FieldError
            id="contact-name-error"
            message={errors.name?.message}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">Email address</label>
          <input
            autoComplete="email"
            autoCapitalize="none"
            id="contact-email"
            inputMode="email"
            maxLength={254}
            {...register("email")}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            required
            type="email"
          />
          <FieldError
            id="contact-email-error"
            message={errors.email?.message}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-phone">Phone number</label>
          <input
            autoComplete="tel"
            id="contact-phone"
            inputMode="tel"
            maxLength={30}
            {...register("phone")}
            aria-describedby={errors.phone ? "contact-phone-error" : undefined}
            aria-invalid={Boolean(errors.phone)}
            required
            type="tel"
          />
          <FieldError
            id="contact-phone-error"
            message={errors.phone?.message}
          />
        </div>

        <div className="contact-field">
          <label htmlFor="contact-subject">Subject</label>
          <input
            id="contact-subject"
            maxLength={120}
            {...register("subject")}
            aria-describedby={
              errors.subject ? "contact-subject-error" : undefined
            }
            aria-invalid={Boolean(errors.subject)}
            required
            type="text"
          />
          <FieldError
            id="contact-subject-error"
            message={errors.subject?.message}
          />
        </div>

        <div className="contact-field contact-field-wide">
          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            maxLength={3000}
            placeholder="Tell us what’s on your mind..."
            rows={6}
            {...register("message")}
            aria-describedby={
              errors.message ? "contact-message-error" : undefined
            }
            aria-invalid={Boolean(errors.message)}
            required
          />
          <FieldError
            id="contact-message-error"
            message={errors.message?.message}
          />
        </div>
      </div>

      {submitError && (
        <p className="contact-submit-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="contact-form-submit">
        <p>
          Messages are saved only after successful submission. No automatic
          email reply is configured for this demo.
        </p>
        <button
          className="button contact-submit-button"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              Sending message
              <LoaderCircle
                aria-hidden="true"
                className="contact-spinner"
                size={16}
              />
            </>
          ) : (
            <>
              Send your message
              <ArrowRight aria-hidden="true" size={15} />
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
