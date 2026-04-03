import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db } from "../firebase.js";
import type {
  ContentItem,
  ContentPhase,
  ContentStatus,
  ContentTimestamps,
  ContentType,
} from "../../../content-board/src/types/content.js";

// ---------------------------------------------------------------------------
// Firestore DocumentData → ContentItem normalizer (Admin SDK variant)
// ---------------------------------------------------------------------------

function convertTimestamp(v: unknown): string | null {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return null;
}

function normalizeContentItem(
  id: string,
  data: FirebaseFirestore.DocumentData,
): ContentItem {
  const asString = (v: unknown): string | null =>
    typeof v === "string" ? v : null;

  const ts = (data.timestamps ?? {}) as Record<string, unknown>;

  return {
    id,
    title: data.title ?? "",
    description: data.description ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    status: data.status ?? "draft",
    phase: data.phase ?? "pre-production",
    order: data.order ?? 0,
    contentType: data.contentType ?? "video",
    parentVideoId: asString(data.parentVideoId),
    script: asString(data.script),
    platformVersions: Array.isArray(data.platformVersions)
      ? data.platformVersions
      : [],
    youtubeUrl: asString(data.youtubeUrl),
    demoItems: Array.isArray(data.demoItems) ? data.demoItems : [],
    talkingPoints: Array.isArray(data.talkingPoints)
      ? data.talkingPoints
      : [],
    shootingScript: asString(data.shootingScript),
    thumbnailIdeas: asString(data.thumbnailIdeas),
    linkedContent: Array.isArray(data.linkedContent)
      ? data.linkedContent
      : [],
    notes: asString(data.notes),
    learnings: Array.isArray(data.learnings) ? data.learnings : [],
    feedback: Array.isArray(data.feedback) ? data.feedback : [],
    timestamps: {
      created: convertTimestamp(ts.created) ?? new Date().toISOString(),
      technicallyReady: convertTimestamp(ts.technicallyReady),
      shootingScriptReady: convertTimestamp(ts.shootingScriptReady),
      readyToRecord: convertTimestamp(ts.readyToRecord),
      recorded: convertTimestamp(ts.recorded),
      edited: convertTimestamp(ts.edited),
      published: convertTimestamp(ts.published),
      shortsExtracted: convertTimestamp(ts.shortsExtracted),
      lifetimeValueEnds: convertTimestamp(ts.lifetimeValueEnds),
      updated: convertTimestamp(ts.updated) ?? new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

const CONTENT_STATUSES = [
  "draft",
  "technically-ready",
  "shooting-script-ready",
  "ready-to-record",
  "recorded",
  "edited",
  "published",
  "extracted-shorts",
  "lifetime-value-ends",
] as const;

const CONTENT_PHASES = [
  "pre-production",
  "production",
  "post-production",
] as const;

const CONTENT_TYPES = ["video", "short"] as const;

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
