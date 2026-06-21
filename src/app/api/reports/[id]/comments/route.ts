import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-auth";
import { translate } from "@/lib/deepl";

const CreateCommentSchema = z.object({
  body: z.string().min(1),
});

/** GET /api/reports/[id]/comments — コメント一覧 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report) return notFound();

  // アスリート: 自分のレポートのみ / コーチ: 担当アスリートのレポートのみ
  if (user.role === "ATHLETE" && report.athleteId !== user.id) return notFound();
  if (user.role === "COACH") {
    const athlete = await prisma.user.findUnique({ where: { id: report.athleteId } });
    if (!athlete || athlete.coachId !== user.id) return notFound();
  }

  const comments = await prisma.comment.findMany({
    where: { reportId: id },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(comments);
}

/** POST /api/reports/[id]/comments — コメント作成 (COACH のみ) */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "COACH") return forbidden();

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report) return notFound();

  // 担当アスリートのレポートのみ
  const athlete = await prisma.user.findUnique({ where: { id: report.athleteId } });
  if (!athlete || athlete.coachId !== user.id) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const bodyJa = await translate(parsed.data.body, "JA");

  const comment = await prisma.comment.create({
    data: {
      reportId: id,
      authorId: user.id,
      body: parsed.data.body,
      ...(bodyJa !== null && { bodyJa }),
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  return Response.json(comment, { status: 201 });
}
