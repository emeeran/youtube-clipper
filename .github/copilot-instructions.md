## Quick context for AI coding agents

This repository is an Obsidian plugin called YouTubeClipper. It is written in TypeScript (src/) and compiled/bundled into a single generated artifact (`main.js`) using esbuild. Do not edit `main.js` directly — modify `src/` and rebuild.

Key artifacts:
- `src/` — TypeScript source (components, services, utils, interfaces).
- `main.js` — generated bundle (ESBuild). Rebuild with `npm run dev` or `npm run build`.
- `manifest.json` — Obsidian plugin manifest (version bump handled by `version-bump.mjs`).
- `package.json` — scripts and dev dependencies. Use `npm install`, `npm run dev` (development build), and `npm run build` (type-check + production build).
- `local/README.md` — user-facing usage and feature details; useful examples of expected note formats and settings.

High-level architecture & data flow
- UI layer: `src/components/` contains modals and settings UI (e.g. `youtube-url-modal.ts`). UI calls into service layer via callbacks (e.g. `onProcess`).
- Services: `src/services/` is the core. `ServiceContainer` (see `src/services/service-container.ts`) wires services together and provides DI-like getters. Update settings by calling `ServiceContainer.updateSettings(...)` which resets dependent services (notably AI providers).
- AI layer: providers live in `src/services/ai/` (notably `gemini.ts` and `groq.ts`). `AIService` (fallback manager) attempts providers in order and returns the first non-empty response. Prompts are generated/managed in `src/services/prompt-service.ts`.
- File I/O: `src/services/file/` (Obsidian-specific file writing) — the plugin writes notes to the vault using the Obsidian App instance passed into `ServiceContainer`.

What matters when editing or adding features
- Always change TypeScript under `src/`. Rebuild with `npm run dev` for iterative work. `npm run build` runs a quick type check (`tsc -noEmit`) before producing the production bundle.
- Avoid editing `main.js` — it's generated. Version changes should be done via `version-bump.mjs` and `package.json` scripts.
- API keys/config: API keys are read from plugin settings (not env). `ServiceContainer` creates `GeminiProvider` and `GroqProvider` only if keys are present. Tests and tools should simulate providers or stub network calls.

Project-specific conventions & patterns
- Fallback AI providers: `AIService.process(prompt)` loops providers in order; catch and continue on failures. When adding a provider follow the same contract: `provider.process(prompt): Promise<string>` and expose `name` and `model` properties.
- Gemini expectations: `gemini.ts` expects response at `candidates[0].content.parts[0].text`. Groq expects `choices[0].message`. Validate responses accordingly when adding parsers.
- Centralized messages: user-facing text and error messages are in `src/constants/messages.ts`. Use these constants instead of hard-coded notices.
- Error handling: use `ErrorHandler` (`src/utils/error-handler.ts`) and its `withErrorHandling` helpers for consistent logging and user notices.
- Caching: `src/cache/memory-cache.ts` is used for memoization/URL validation — respect cache APIs instead of re-implementing ad-hoc caches.

Build & developer workflows (short)
- Install: `npm install`
- Dev build (watch/rebuild): `npm run dev` (runs esbuild; examine `esbuild.config.mjs` for flags)
- Production build (type-check + bundle): `npm run build`
- Version bump: `npm run version` (runs `version-bump.mjs` and updates `manifest.json`/`versions.json`). Commit the updated manifest.
- To test in Obsidian: copy `main.js` and `manifest.json` to your vault under `.obsidian/plugins/youtube-clipper/` (see `local/README.md` for manual install steps).

Integration points & external dependencies
- Google Gemini (multimodal) — endpoint and expected model are in `src/constants/api.ts`. Gemini requests use `useAudioVideoTokens` for multimodal analysis.
- Groq — alternate provider with different response format.
- YouTube metadata: uses YouTube oEmbed endpoint and an optional CORS proxy (`API_ENDPOINTS.CORS_PROXY`).
- Network code follows a consistent pattern: check `response.ok`, call `ErrorHandler.handleAPIError(response, provider, fallbackMessage)` to produce rich errors.

Examples to reference in code
- `src/services/service-container.ts` — how services are instantiated and reset.
- `src/services/ai/ai-service.ts` — provider fallback loop and error messages.
- `src/components/modals/youtube-url-modal.ts` — UI → services flow (onProcess callback, progress UI, debounced validation).

Agent rules (brief)
- Never modify `main.js` directly. Edit `src/` and run the build pipeline.
- Prefer using existing constants and helpers: `MESSAGES`, `ErrorHandler`, `ServiceContainer`, and cache APIs.
- When touching AI provider parsing, add unit-style validations matching the existing `validateResponse` logic in `src/services/ai/base.ts`.

If anything's unclear or you want more detail (example prompts, stub patterns for tests, or suggested unit tests), tell me which area to expand and I'll iterate.
