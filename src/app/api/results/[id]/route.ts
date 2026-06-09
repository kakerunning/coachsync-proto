import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
} from "@/lib/api-auth";

const UpdateResultSchema = z.object({
  setIndex: z.number().int().min(1).optional(),
  segmentIndex: z.number().int().min(1).optional(),
  distanceM: z.number().int().min(1).nullable().optional(),
  timeSec: z.number().positive().nullable().optional(),
  isDnf: z.boolean().optional(),
  note: z.string().nullable().optional(),
});

async function getResultWithAuth(resultId: string, userId: string) {
  const result = await prisma.sessionResult.findUnique({
    where: { id: resultId },
    include: {
      session: {
        include: { report: { select: { athleteId: true } } },
      },
    },
  });
  if (!result || result.session.report.athleteId !== userId) return null;
  return result;
}

/** PATCH /api/results/[id] — Result 1件更新 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const { id } = await params;
  const result = await getResultWithAuth(id, user.id);
  if (!result) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = UpdateResultSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  try {
    const updated = await prisma.sessionResult.update({
      where: { id },
      data: parsed.data,
    });
    return Response.json(updated);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return Response.json({ error: "Conflict" }, { status: 409 });
    }
    throw err;
  }
}

/** DELETE /api/results/[id] — Result 1件削除 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const { id } = await params;
  const result = await getResultWithAuth(id, user.id);
  if (!result) return notFound();

  await prisma.sessionResult.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
