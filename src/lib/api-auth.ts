import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/** Route Handler 内で認証済みユーザーの Prisma User レコードを取得する */
export async function getApiUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return prisma.user.findUnique({ where: { email: user.email } });
}

/** 月曜日 00:00 UTC に正規化した weekStart を返す */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ...6=Sat
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound() {
  return Response.json({ error: "Not found" }, { status: 404 });
}

export function badRequest(details?: unknown) {
  return Response.json({ error: "Bad request", details }, { status: 400 });
}
