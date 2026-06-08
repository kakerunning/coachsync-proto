import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
} from "@/lib/api-auth";

const UpdateSessionSchema = z.object({
  date: z.string().optional(),
  menuText: z.string().optional(),
});

async function getSessionWithAuth(sessionId: string, userId: string) {
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: { report: { select: { athleteId: true, weekStart: true } } },
  });
  if (!session || session.report.athleteId !== userId) return null;
  return session;
}

/** PATCH /api/sessions/[id] — セッション更新 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const { id } = await params;
  const session = await getSessionWithAuth(id, user.id);
  if (!session) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = UpdateSessionSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const data: { date?: Date; menuText?: string } = {};

  if (parsed.data.date !== undefined) {
    const date = new Date(parsed.data.date);
    if (isNaN(date.getTime())) return badRequest("invalid date");

    const weekStart = new Date(session.report.weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    if (date < weekStart || date >= weekEnd) {
      return badRequest("date is out of week range");
    }
    data.date = date;
  }

  if (parsed.data.menuText !== undefined) {
    data.menuText = parsed.data.menuText;
  }

  const updated = await prisma.trainingSession.update({
    where: { id },
    data,
  });

  return Response.json(updated);
}

/** DELETE /api/sessions/[id] — セッション削除 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const { id } = await params;
  const session = await getSessionWithAuth(id, user.id);
  if (!session) return notFound();

  await prisma.trainingSession.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
