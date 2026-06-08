import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  getWeekStart,
  unauthorized,
  forbidden,
} from "@/lib/api-auth";

const ListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

/** GET /api/reports?limit=N — 自分のレポート一覧 */
export async function GET(request: Request) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const url = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(
    Object.fromEntries(url.searchParams)
  );
  const limit = parsed.success ? parsed.data.limit : 5;

  const reports = await prisma.weeklyReport.findMany({
    where: { athleteId: user.id },
    orderBy: { weekStart: "desc" },
    take: limit,
    select: {
      id: true,
      weekStart: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json(reports);
}

/** POST /api/reports — 今週のレポートを作成 (既存なら既存を返す) */
export async function POST() {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const weekStart = getWeekStart();

  const report = await prisma.weeklyReport.upsert({
    where: {
      athleteId_weekStart: { athleteId: user.id, weekStart },
    },
    update: {},
    create: { athleteId: user.id, weekStart, reflection: "" },
  });

  return Response.json(report, { status: 200 });
}
