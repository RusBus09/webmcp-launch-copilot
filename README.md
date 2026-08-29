# WebMCP Launch Copilot

An agent-native launch command center for indie game devs. Built for the [WebMCP Challenge](https://webmcp.devpost.com/).

The site registers structured tools via the Chrome WebMCP API (`document.modelContext.registerTool`). An AI agent (ChatGPT in-app browser or Chrome with WebMCP enabled) can call these tools directly: draft outreach, track launch tasks, analyze a Steam page, pull launch-phase intel. The human approves anything that sends.

Agent drafts, human confirms. That's the pattern.

## Stack

- Vite + React + TypeScript
- WebMCP via `document.modelContext` (with `navigator.modelContext` fallback for Chrome 146-149)
- Deployed on Vercel

## WebMCP tools

| Tool | Purpose | Side effects |
|------|---------|--------------|
| `get_launch_checklist` | Fetch the launch task board | none |
| `update_task_status` | Mark a task in-progress/done | app state |
| `analyze_steam_page` | Fetch a Steam page, score it for launch readiness | none |
| `draft_press_outreach` | Draft an outreach email from launch facts | app state (drafts only) |
| `send_outreach_draft` | Send a draft (requires explicit human confirmation in the UI) | external |

## Run locally

```bash
npm install
npm run dev
```

Test with Google Chrome 149+: enable `chrome://flags/#enable-webmcp-testing`, restart, open DevTools > Application > WebMCP tools, or drive it with ChatGPT's in-app browser.

## License

MIT