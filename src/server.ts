import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAnalyzeWithRules } from "./tools/analyzeWithRules";
import { registerFetchMrContext } from "./tools/fetchMrContext";
import { registerPostInlineComment } from "./tools/postInlineComment";
import { registerPostMrComment } from "./tools/postMrComment";



export async function startServer(): Promise<void> {
  const server = new McpServer({
    name: "gitlab-review-server",
    version: "2.0.0",
  });

  registerFetchMrContext(server);
  registerAnalyzeWithRules(server);
  registerPostMrComment(server);
  registerPostInlineComment(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
