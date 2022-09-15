import { z } from "zod";
import { createRouter } from "./context";
import { TRPCError } from "@trpc/server";

/**
 * tRPC mutation, using zod for input validation,
 * and contains a resolve function that runs a single prisma query,
 * to create a new row in the Guestbook table
 */
export const guestbookRouter = createRouter()
  /// get all messages in the guestbook (this doesn't need to be protected)
  .query("getAllMessages", {
    async resolve({ ctx }) {
      try {
        return await ctx.prisma.guestBook.findMany({
          select: {
            name: true,
            message: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
      } catch (error) {
        console.log("error", error);
      }
    },
  })
  .middleware(async ({ ctx, next }) => {
    // Any queries or mutations after this middleware will
    // raise an error unless there is a current session
    // that way we can ensure that only logged in users can post a message to the guestbook
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next();
  })
  .mutation("postMessage", {
    input: z.object({
      name: z.string(),
      email: z.string(),
      message: z.string(),
    }),

    async resolve({ ctx, input }) {
      try {
        await ctx.prisma.guestBook.create({
          data: {
            name: input.name,
            email: input.email,
            message: input.message,
          },
        });
      } catch (err) {
        console.log(err);
      }
    },
  });