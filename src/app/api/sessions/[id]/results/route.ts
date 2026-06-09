import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getApiUser,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
} from "@/lib/api-auth";

const CreateResultSchema = z.object({
  setIndex: z.number().int().min(1),
  segmentIndex: z.number().int().min(1),
  distanceM: z.number().int().min(1).nullable().optional(),
  timeSec: z.number().positive().nullable().optional(),
  isDnf: z.boolean().optional().default(false),
  note: z.string().nullable().optional(),
});

/** POST /api/sessions/[sessionId]/results — Result 1件追加 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "ATHLETE") return forbidden();

  const { id: sessionId } = await params;

  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: { report: { select: { athleteId: true } } },
  });
  if (!session || session.report.athleteId !== user.id) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = CreateResultSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  try {
    const result = await prisma.sessionResult.create({
      data: {
        sessionId,
        setIndex: parsed.data.setIndex,
        segmentIndex: parsed.data.segmentIndex,
        distanceM: parsed.data.distanceM ?? null,
        timeSec: parsed.data.timeSec ?? null,
        isDnf: parsed.data.isDnf ?? false,
        note: parsed.data.note ?? null,
      },
    });
    return Response.json(result, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return Response.json({ error: "Conflict" }, { status: 409 });
    }
    throw err;
  }
}
