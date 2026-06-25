# cb-mcp-server

MCP (Model Context Protocol) server that bridges [cowork-boilerplate](https://github.com/jitangupta/cowork-boilerplate) and [content-board](https://github.com/jitangupta/content-board).

It exposes the Content Board's Firebase Firestore data as MCP tools, so any MCP-compatible AI assistant (e.g. Claude) can read and manage content items without touching the app directly.

> **Local only** — this server runs as a stdio process on your machine and is launched directly by your MCP client (e.g. Claude Desktop). No hosting, no port, no internet exposure needed.

```
cowork-boilerplate  ──(MCP client)──▶  cb-mcp-server  ──▶  content-board (Firestore)
```

## Tools

| Tool | Description |
|------|-------------|
| `ping` | Health check — returns `pong` |
| `list_contents` | List all content items, with optional filters by phase, status, or type |
| `get_content` | Fetch a single content item by Firestore document ID |
| `create_content` | Create a new content item (starts as `draft` in `pre-production`) |
| `update_content` | Patch fields on an existing item; phase is recomputed automatically when status changes |

### Content lifecycle

Statuses map to phases automatically:

| Phase | Statuses |
|-------|---------|
| `pre-production` | `draft` → `technically-ready` → `shooting-script-ready` → `ready-to-record` |
| `production` | `recorded` → `edited` |
| `post-production` | `published` → `extracted-shorts` → `lifetime-value-ends` |

Content types: `video` or `short`. Shorts carry a `parentVideoId` pointing to their source video.

## Setup

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore enabled
- A Firebase service account key (JSON)

### Install

```bash
npm install
```

### Environment

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
```

### Run

```bash
# Development (tsx, no build step)
npm run dev

# Production
npm run build
npm start
```

## Connecting to Claude

Add this server to your Claude Desktop or MCP client config:

```json
{
  "mcpServers": {
    "content-board": {
      "command": "node",
      "args": ["/path/to/cb-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/serviceAccountKey.json"
      }
    }
  }
}
```

For development with `tsx`:

```json
{
  "mcpServers": {
    "content-board": {
      "command": "npx",
      "args": ["tsx", "/path/to/cb-mcp-server/src/index.ts"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/serviceAccountKey.json"
      }
    }
  }
}
```

## Related repos

- [content-board](https://github.com/jitangupta/content-board) — the web app (UI) for managing content
- [cowork-boilerplate](https://github.com/jitangupta/cowork-boilerplate) — the AI-assisted workspace that consumes this MCP server
