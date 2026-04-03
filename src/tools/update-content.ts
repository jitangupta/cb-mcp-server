import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db } from "../firebase.js";
import type { ContentStatus } from "../types.js";
import {
  CONTENT_STATUSES,
  CONTENT_TYPES,
  PHASE_MAP,
  normalizeContentItem,
} from "../normalize.js";

export function registerUpdateContent(server: McpServer): void {
  server.tool(
    "update_content",
    "Update fields on an existing content item. Only the fields you provide will be changed; omitted fields are left untouched. If status is changed, phase is recomputed automatically.",
    {
      content_id: z
        .string()
        .describe("The Firestore document ID of the content item to update"),
      title: z.string().optional().describe("Content title"),
      description: z.string().optional().describe("Content description"),
      tags: z
        .array(z.string())
        .optional()
        .describe("Tags / keywords for the content"),
      status: z
        .enum(CONTENT_STATUSES)
        .optional()
        .describe("Lifecycle status — phase will be recomputed if changed"),
      content_type: z
        .enum(CONTENT_TYPES)
        .optional()
        .describe("Content type: video or short"),
      script: z
        .string()
        .nullable()
        .optional()
        .describe("Main script text (null to clear)"),
      shooting_script: z
        .string()
        .nullable()
        .optional()
        .describe("Shooting script text (null to clear)"),
      thumbnail_ideas: z
        .string()
        .nullable()
        .optional()
        .describe("Thumbnail ideas (null to clear)"),
      notes: z
        .string()
        .nullable()
        .optional()
        .describe("Free-form notes (null to clear)"),
      youtube_url: z
        .string()
        .nullable()
        .optional()
        .describe("YouTube video URL (null to clear)"),
      parent_video_id: z
        .string()
        .nullable()
        .optional()
        .describe("Parent video document ID for shorts (null to clear)"),
    },
    {
      title: "Update Content",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    async ({
      content_id,
      title,
      description,
      tags,
      status,
      content_type,
      script,
      shooting_script,
      thumbnail_ideas,
      notes,
      youtube_url,
      parent_video_id,
    }) => {
      try {
        const updates: Record<string, unknown> = {};

        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (tags !== undefined) updates.tags = tags;
        if (status !== undefined) {
          updates.status = status;
          updates.phase = PHASE_MAP[status as ContentStatus];
        }
        if (content_type !== undefined) updates.contentType = content_type;
        if (script !== undefined) updates.script = script;
        if (shooting_script !== undefined)
          updates.shootingScript = shooting_script;
        if (thumbnail_ideas !== undefined)
          updates.thumbnailIdeas = thumbnail_ideas;
        if (notes !== undefined) updates.notes = notes;
        if (youtube_url !== undefined) updates.youtubeUrl = youtube_url;
        if (parent_video_id !== undefined)
          updates.parentVideoId = parent_video_id;

        if (Object.keys(updates).length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No fields provided to update.",
              },
            ],
            isError: true,
          };
        }

        updates["timestamps.updated"] = FieldValue.serverTimestamp();

        const docRef = db.collection("contents").doc(content_id);
        await docRef.update(updates);

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
