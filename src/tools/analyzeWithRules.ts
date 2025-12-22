import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { rules } from "../rules/index.js";
import type { ReviewFinding, FileChange } from "../rules/types.js";

export function registerAnalyzeWithRules(server: McpServer): void {
  server.registerTool(
    "analyze_changes_with_rules",
    {
      description: "Analyze MR changes with built-in review rules",
      inputSchema: z.object({
        changes: z.array(
          z.object({
            filePath: z.string(),
            diff: z.string(),
            isNewFile: z.boolean().optional(),
            isDeleted: z.boolean().optional(),
          })
        ),
      }),
    },
    async ({ changes }) => {
      const findings: ReviewFinding[] = [];

      for (const change of changes as FileChange[]) {
        for (const rule of rules) {
          findings.push(...rule(change));
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Analysis complete. Found ${findings.length} issue(s).`,
          },
        ],
        structuredContent: {
          findings,
        },
      };
    }
  );
}
