import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { gitlabApi } from "../gitlab/client.js";
import { parseMrUrl } from "../utils/parseMrUrl.js";

export function registerPostMrComment(server: McpServer): void {
  server.registerTool(
    "post_mr_comment",
    {
      description: "Post a summary comment to the GitLab MR",
      inputSchema: z.object({
        url: z.string(),
        commentBody: z.string(),
      }),
    },
    async ({ url, commentBody }) => {
      const { projectPath, mrIid } = parseMrUrl(url);

      const res = await gitlabApi.post(
        `/projects/${encodeURIComponent(
          projectPath
        )}/merge_requests/${mrIid}/notes`,
        { body: commentBody }
      );

      return {
        content: [
          {
            type: "text",
            text: `✅ Comment posted (id: ${res.data.id})`,
          },
        ],
      };
    }
  );
}
