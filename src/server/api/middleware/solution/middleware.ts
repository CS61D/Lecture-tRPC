import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { userPostsTable } from "~/server/db/schema";
/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// Procedure that requires user to be an owner of the post
export const postProcedure = protectedProcedure
  .input(
    z.object({
      postId: z.string(),
    }),
  )
  .use(async ({ ctx, input, next }) => {
    const [userPost] = await db
      .select()
      .from(userPostsTable)
      .where(
        and(
          eq(userPostsTable.userId, ctx.session.user.id),
          eq(userPostsTable.postId, input.postId),
        ),
      );
    if (!userPost) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to edit this post",
      });
    }
    return next({ ctx });
  });
