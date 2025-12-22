import { z } from "zod";

export const ReviewResultSchema = z.object({
  summary: z.string(),
  issues: z.array(
    z.object({
      filePath: z.string(),
      line: z.number().optional(),
      severity: z.enum(["info", "warning", "error"]),
      comment: z.string(),
      suggestion: z.string(),
    })
  ),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;
