import type {
  ContentItem,
  ContentPhase,
  ContentStatus,
} from "./types.js";

// ---------------------------------------------------------------------------
// Domain constants
// ---------------------------------------------------------------------------

export const CONTENT_STATUSES = [
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

export const CONTENT_PHASES = [
  "pre-production",
  "production",
  "post-production",
] as const;

export const CONTENT_TYPES = ["video", "short"] as const;

export const PHASE_MAP: Record<ContentStatus, ContentPhase> = {
  "draft": "pre-production",
  "technically-ready": "pre-production",
  "shooting-script-ready": "pre-production",
  "ready-to-record": "pre-production",
  "recorded": "production",
  "edited": "production",
  "published": "post-production",
  "extracted-shorts": "post-production",
  "lifetime-value-ends": "post-production",
};

// ---------------------------------------------------------------------------
// Firestore DocumentData → ContentItem normalizer (Admin SDK variant)
// ---------------------------------------------------------------------------

export function convertTimestamp(v: unknown): string | null {
  if (v && typeof v === "object" && "toDate" in v) {
    return (v as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof v === "string") return v;
  return null;
}

export function normalizeContentItem(
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
