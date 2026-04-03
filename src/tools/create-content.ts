import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db } from "../firebase.js";
import { CONTENT_TYPES, normalizeContentItem } from "../normalize.js";

export function registerCreateContent(server: McpServer): void {
  server.tool(
    "create_content",
    "Create a new content item in draft status. Returns the created document with its generated ID.",
    {
      title: z.string().describe("Content title"),
      description: z
        .string()
        .optional()
        .describe("Content description (defaults to empty)"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Tags / keywords for the content"),
      content_type: z
        .enum(CONTENT_TYPES)
        .optional()
        .describe("Content type (defaults to video)"),
      parent_video_id: z
        .string()
        .optional()
        .describe("Parent video document ID — required for shorts"),
    },
    {
      title: "Create Content",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    async ({ title, description, tags, content_type, parent_video_id }) => {
      try {
        const now = FieldValue.serverTimestamp();

        const newContent = {
          title,
          description: description ?? "",
          tags: tags ?? [],
          status: "draft",
          phase: "pre-production",
          order: 0,
          contentType: content_type ?? "video",
          parentVideoId: parent_video_id ?? null,
          script: null,
          platformVersions: [],
          youtubeUrl: null,
          demoItems: [],
          talkingPoints: [],
          shootingScript: null,
          thumbnailIdeas: null,
          linkedContent: [],
          notes: null,
          learnings: [],
          feedback: [],
          timestamps: {
            created: now,
            technicallyReady: null,
            shootingScriptReady: null,
            readyToRecord: null,
            recorded: null,
            edited: null,
            published: null,
            shortsExtracted: null,
            lifetimeValueEnds: null,
            updated: now,
          },
        };

        const docRef = await db.collection("contents").add(newContent);
        const doc = await docRef.get();
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
