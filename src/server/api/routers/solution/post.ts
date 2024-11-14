import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { postProcedure } from "../../middleware/solution/middleware";
import { posts } from "~/server/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const postRouter = createTRPCRouter({
  // List
  list: publicProcedure.query(async ({ ctx }) => {
    // Artificial 2 second delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const allPosts = await ctx.db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt));
    return allPosts;
  }),
  // TODO make protected
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Artificial 2 second delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const [post] = await ctx.db.insert(posts).values(input).returning();
      if (!post) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
        });
      }
      return post;
    }),
  edit: postProcedure
    .input(
      z.object({
        postName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {}),
});
