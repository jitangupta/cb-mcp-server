import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db } from "../firebase.js";
import type { ContentItem } from "../types.js";
import {
  CONTENT_PHASES,
  CONTENT_STATUSES,
  CONTENT_TYPES,
  normalizeContentItem,
} from "../normalize.js";

export function registerListContents(server: McpServer): void {
  server.tool(
    "list_contents",
    "List all content items from the Content Board. Returns every document in the contents collection, optionally filtered by phase, status, or content type.",
    {
      filter_by_phase: z
        .enum(CONTENT_PHASES)
        .optional()
        .describe("Filter by lifecycle phase: pre-production, production, or post-production"),
      filter_by_status: z
        .enum(CONTENT_STATUSES)
        .optional()
        .describe("Filter by specific status (e.g. draft, recorded, published)"),
      content_type: z
        .enum(CONTENT_TYPES)
        .optional()
        .describe("Filter by content type: video or short"),
    },
    {
      title: "List Contents",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({ filter_by_phase, filter_by_status, content_type }) => {
      try {
        const snapshot = await db
          .collection("contents")
          .orderBy("phase")
          .orderBy("order")
          .get();

        let items: ContentItem[] = snapshot.docs.map((doc) =>
          normalizeContentItem(doc.id, doc.data()),
        );

        if (filter_by_phase) {
          items = items.filter((i) => i.phase === filter_by_phase);
        }
        if (filter_by_status) {
          items = items.filter((i) => i.status === filter_by_status);
        }
        if (content_type) {
          items = items.filter((i) => i.contentType === content_type);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(items, null, 2),
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
