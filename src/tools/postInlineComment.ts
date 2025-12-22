import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { gitlabApi } from "../gitlab/client";
import { parseMrUrl } from "../utils/parseMrUrl";

export function registerPostInlineComment(server: McpServer): void {
  server.registerTool(
    "post_inline_comment",
    {
      description: "Post an inline review comment on a specific line",
      inputSchema: z.object({
        url: z.string(),
        filePath: z.string(),
        lineNumber: z.number(),
        commentBody: z.string(),
      }),
    },
    async ({ url, filePath, lineNumber, commentBody }) => {
      const { projectPath, mrIid } = parseMrUrl(url);

      const mrRes = await gitlabApi.get(
        `/projects/${encodeURIComponent(projectPath)}/merge_requests/${mrIid}`
      );

      const diffRefs = mrRes.data.diff_refs;
      if (!diffRefs) {
        throw new Error("diff_refs not found");
      }

      const res = await gitlabApi.post(
        `/projects/${encodeURIComponent(
          projectPath
        )}/merge_requests/${mrIid}/discussions`,
        {
          body: commentBody,
          position: {
            position_type: "text",
            base_sha: diffRefs.base_sha,
            start_sha: diffRefs.start_sha,
            head_sha: diffRefs.head_sha,
            new_path: filePath,
            new_line: lineNumber,
          },
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Inline comment posted (${res.data.id})`,
          },
        ],
      };
    }
  );
}
