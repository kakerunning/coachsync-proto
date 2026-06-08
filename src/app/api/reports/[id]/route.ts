import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
} from "@/lib/api-auth";

const UpdateReportSchema = z.object({
  reflection: z.string(),
});

/** GET /api/reports/[id] — レポート詳細 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: { sessions: { orderBy: { date: "asc" } } },
  });
  if (!report || report.athleteId !== user.id) return notFound();

  return Response.json(report);
}

/** PATCH /api/reports/[id] — reflection を更新 (下書き保存) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report || report.athleteId !== user.id) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = UpdateReportSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const updated = await prisma.weeklyReport.update({
    where: { id },
    data: { reflection: parsed.data.reflection },
  });

  return Response.json(updated);
}
