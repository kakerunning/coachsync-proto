import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  unauthorized,
  forbidden,
  notFound,
} from "@/lib/api-auth";
import { translate } from "@/lib/deepl";

/** POST /api/reports/[id]/submit — submittedAt を現在時刻に設定 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({ where: { id } });
  if (!report || report.athleteId !== user.id) return notFound();

  console.log(`[submit] reportId=${id} reflection="${report.reflection?.substring(0, 50)}"`);

  const reflectionDe = report.reflection
    ? await translate(report.reflection, "DE")
    : null;

  console.log(`[submit] reflectionDe="${reflectionDe?.substring(0, 50)}"`);

  const updated = await prisma.weeklyReport.update({
    where: { id },
    data: {
      submittedAt: new Date(),
      ...(reflectionDe !== null && { reflectionDe }),
    },
  });

  return Response.json(updated);
}
