import { z } from "zod";
import { authorizeAdmin } from "@/lib/admin/guard";
import { authorizationFailure } from "@/lib/admin/http";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function inRange(value: string) {
  if (!dateSchema.safeParse(value).success) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function formatLocalDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const authorization = await authorizeAdmin();
  const failure = authorizationFailure(authorization);
  if (failure) return failure;

  try {
    const supabase = getSupabaseAdminClient();
    const { data: settings, error: settingsError } = await supabase
      .from("restaurant_settings")
      .select("time_zone")
      .eq("id", "default")
      .maybeSingle();
    if (settingsError) throw settingsError;
    const timeZone = settings?.time_zone ?? "America/New_York";
    let today: string;
    try {
      today = formatLocalDate(new Date(), timeZone);
    } catch {
      today = formatLocalDate(new Date(), "America/New_York");
    }

    const params = new URL(request.url).searchParams;
    const from = params.get("from") ?? shiftDate(today, -6);
    const to = params.get("to") ?? today;
    const start = new Date(`${from}T00:00:00Z`);
    const end = new Date(`${to}T00:00:00Z`);
    const days = (end.valueOf() - start.valueOf()) / 86400000;
    if (!inRange(from) || !inRange(to) || days < 0 || days > 89) {
      return Response.json(
        { error: { code: "INVALID_DATE_RANGE", message: "Choose a valid date range of up to 90 days." } },
        { status: 400 },
      );
    }

    const [
      reservationCount,
      pendingCount,
      confirmedCount,
      todayCount,
      contactCount,
      menuCount,
      activity,
      recentReservations,
      recentMessages,
    ] = await Promise.all([
      supabase.from("reservations").select("id", { count: "exact", head: true }).gte("reservation_date", from).lte("reservation_date", to),
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "pending").gte("reservation_date", from).lte("reservation_date", to),
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("reservation_date", from).lte("reservation_date", to),
      supabase.from("reservations").select("id", { count: "exact", head: true }).eq("reservation_date", today),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      supabase.from("menu_items").select("id", { count: "exact", head: true }),
      supabase.rpc("admin_reservation_activity", { p_from: from, p_to: to }),
      supabase.from("reservations").select("*").gte("reservation_date", from).lte("reservation_date", to).order("reservation_date", { ascending: false }).order("reservation_time", { ascending: false }).limit(8),
      supabase.from("contact_messages").select("id,customer_name,subject,status,created_at").order("created_at", { ascending: false }).limit(5),
    ]);

    const errors = [
      reservationCount.error,
      pendingCount.error,
      confirmedCount.error,
      todayCount.error,
      contactCount.error,
      menuCount.error,
      activity.error,
      recentReservations.error,
      recentMessages.error,
    ].filter(Boolean);
    if (errors.length) throw errors[0];

    return Response.json(
      {
        from,
        to,
        totals: {
          reservations: reservationCount.count ?? 0,
          pendingReservations: pendingCount.count ?? 0,
          confirmedReservations: confirmedCount.count ?? 0,
          contactMessages: contactCount.count ?? 0,
          menuItems: menuCount.count ?? 0,
          todaysReservations: todayCount.count ?? 0,
        },
        activity: activity.data ?? [],
        recentReservations: recentReservations.data ?? [],
        recentMessages: recentMessages.data ?? [],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: { code: "DASHBOARD_UNAVAILABLE", message: "Dashboard information could not be loaded." } },
      { status: 500 },
    );
  }
}
