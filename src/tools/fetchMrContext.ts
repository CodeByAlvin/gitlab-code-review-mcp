import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { gitlabApi } from "../gitlab/client.js";
import { parseMrUrl } from "../utils/parseMrUrl.js";

export function registerFetchMrContext(server: McpServer): void {
  server.registerTool(
    "fetch_mr_context",
    {
      description: "Fetch GitLab MR metadata and changes",
      inputSchema: z.object({
        url: z.string(),
      }),
    },
    async ({ url }) => {
      const { projectPath, mrIid } = parseMrUrl(url);

      const [mrRes, changesRes] = await Promise.all([
        gitlabApi.get(
          `/projects/${encodeURIComponent(projectPath)}/merge_requests/${mrIid}`
        ),
        gitlabApi.get(
          `/projects/${encodeURIComponent(
            projectPath
          )}/merge_requests/${mrIid}/changes`
        ),
      ]);

      const structured = {
        mr: {
          id: mrRes.data.iid as number,
          title: mrRes.data.title as string,
          description: mrRes.data.description as string,
          author: mrRes.data.author?.name as string | undefined,
          sourceBranch: mrRes.data.source_branch as string,
        },
        changes: (changesRes.data.changes as any[]).map((c) => ({
          filePath: c.new_path as string,
          diff: c.diff as string,
          isNewFile: c.new_file as boolean,
          isDeleted: c.deleted_file as boolean,
        })),
      };

      return {
        // ✅ content 只做人类可读摘要
        content: [
          {
            type: "text",
            text: `Fetched MR !${structured.mr.id}: ${structured.mr.title}\nFiles changed: ${structured.changes.length}`,
          },
        ],

        // ✅ 真正的 JSON 在这里
        structuredContent: structured,
      };
    }
  );
}
