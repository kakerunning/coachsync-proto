import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getApiUser, unauthorized, forbidden, notFound, badRequest } from "@/lib/api-auth";
import { translate } from "@/lib/deepl";

const UpdateCommentSchema = z.object({
  body: z.string().min(1),
});

async function getOwnComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== userId) return null;
  return comment;
}

/** PATCH /api/comments/[id] — コメント編集 (自分のコメントのみ) */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "COACH") return forbidden();

  const { id } = await params;
  const comment = await getOwnComment(id, user.id);
  if (!comment) return notFound();

  const body = await req.json().catch(() => null);
  const parsed = UpdateCommentSchema.safeParse(body);
  if (!parsed.success) return badRequest(parsed.error.flatten());

  const bodyJa = await translate(parsed.data.body, "JA");

  const updated = await prisma.comment.update({
    where: { id },
    data: {
      body: parsed.data.body,
      bodyJa: bodyJa ?? null,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  return Response.json(updated);
}

/** DELETE /api/comments/[id] — コメント削除 (自分のコメントのみ) */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getApiUser();
  if (!user) return unauthorized();
  if (user.role !== "COACH") return forbidden();

  const { id } = await params;
  const comment = await getOwnComment(id, user.id);
  if (!comment) return notFound();

  await prisma.comment.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
