import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db } from "../firebase.js";
import { normalizeContentItem } from "../normalize.js";

export function registerGetContent(server: McpServer): void {
  server.tool(
    "get_content",
    "Fetch a single content item by its document ID, including all embedded data (learnings, feedback, demo items, talking points, platform versions, linked content).",
    {
      content_id: z
        .string()
        .describe("The Firestore document ID of the content item"),
    },
    {
      title: "Get Content",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ content_id }) => {
      try {
        const doc = await db.collection("contents").doc(content_id).get();

        if (!doc.exists) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Content "${content_id}" not found.`,
              },
            ],
            isError: true,
          };
        }

        const item = normalizeContentItem(doc.id, doc.data()!);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(item, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
