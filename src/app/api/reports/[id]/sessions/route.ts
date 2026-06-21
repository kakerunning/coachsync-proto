import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
} from "@/lib/api-auth";
import { translate } from "@/lib/deepl";

const CreateSessionSchema = z.object({
  date: z.string(),
  menuText: z.string().optional().default(""),
});

/** POST /api/reports/[id]/sessions — セッション追加 */
export async function POST(
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
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const date = new Date(parsed.data.date);
  if (isNaN(date.getTime())) return badRequest("invalid date");

  const weekStart = new Date(report.weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  if (date < weekStart || date >= weekEnd) {
    return badRequest("date is out of week range");
  }

  const menuText = parsed.data.menuText;
  const menuTextDe = menuText ? await translate(menuText, "DE") : null;

  const session = await prisma.trainingSession.create({
    data: {
      reportId: id,
      date,
      menuText,
      ...(menuTextDe !== null && { menuTextDe }),
    },
  });

  return Response.json(session, { status: 201 });
}
