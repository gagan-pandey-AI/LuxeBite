"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  adminLoginSchema,
  type AdminLoginInput,
} from "@/lib/admin/login-schema";

function isErrorResponse(value: unknown): value is {
  error: { message: string; fieldErrors?: Record<string, string[]> };
} {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return false;
  }
  const error = value.error;
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  );
}

export function AdminLoginForm({ nextPath = "/admin/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<AdminLoginInput>({
    defaultValues: { email: "", password: "" },
    resolver: zodResolver(adminLoginSchema),
  });

  const submitLogin = handleSubmit(async (values) => {
    setSubmitError("");

    try {
      const response = await fetch("/api/admin/login", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        if (isErrorResponse(payload)) {
          for (const field of ["email", "password"] as const) {
            const message = payload.error.fieldErrors?.[field]?.[0];
            if (message) {
              setError(field, { message, type: "server" });
            }
          }
          setSubmitError(payload.error.message);
        } else {
          setSubmitError("Sign-in is temporarily unavailable.");
        }
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setSubmitError("We couldn't reach the sign-in service. Try again.");
    }
  });

  return (
    <form className="admin-login-form" noValidate onSubmit={submitLogin}>
      <div className="admin-login-icon" aria-hidden="true">
        <LockKeyhole size={21} />
      </div>
      <div className="admin-login-field">
        <label htmlFor="admin-email">Email address</label>
        <input
          autoComplete="username"
          id="admin-email"
          inputMode="email"
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "admin-email-error" : undefined}
          autoCapitalize="none"
          required
          type="email"
        />
        {errors.email?.message && (
          <span className="admin-field-error" id="admin-email-error" role="alert">
            {errors.email.message}
          </span>
        )}
      </div>
      <div className="admin-login-field">
        <label htmlFor="admin-password">Password</label>
        <input
          autoComplete="current-password"
          id="admin-password"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "admin-password-error" : undefined
          }
          required
          type="password"
        />
        {errors.password?.message && (
          <span className="admin-field-error" id="admin-password-error" role="alert">
            {errors.password.message}
          </span>
        )}
      </div>
      {submitError && (
        <p className="admin-form-error" role="alert">
          {submitError}
        </p>
      )}
      <button className="admin-primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            Verifying access
            <LoaderCircle aria-hidden="true" className="admin-spinner" size={16} />
          </>
        ) : (
          <>
            Sign in securely <ArrowRight aria-hidden="true" size={15} />
          </>
        )}
      </button>
      <p className="admin-login-note">
        Administrator accounts are provisioned privately. Public registration
        is not available.
      </p>
    </form>
  );
}
