# Detached spectral field runtime

PR #72 removes the former `/music` route and its React `FieldScene`. The former scene's **runtime and drawing algorithms** are retained as an opt-in browser module in `components/field/SpectralFieldRuntime.ts`. It is **not mounted** by any page or layout.

## What is preserved

- Deterministic six-mode spectral samples and the R2 sequence in `spectralField.ts`.
- Canvas tracer velocity field, obstacle-aware streamlines, and layer renderer in `SpectralTracerLayer.tsx`.
- The former scene's requestAnimationFrame scheduler, elapsed-time advance, visibility/reduced-motion handling, responsive canvas resolution, 10 Hz DOM obstacle sampling, three consecutive low-FPS windows for quality degradation, theme interpolation, click ripples, sakura/fireflies/grass/danmaku drawing, and cleanup.
- Quality tiers (density, sample count, pixel ratio and target frame interval) remain available inside the runtime implementation.

## Explicit lifecycle contract

The module exports `createSpectralFieldRuntime(options)`. The caller must provide four **already mounted** canvas elements: `speciesCanvas`, `backCanvas`, `frontCanvas`, `interactionCanvas`. The optional `obstacleSelector` defaults to `[data-field-obstacle]`; `danmakuTexts` is an optional array; `desktopOnly` defaults to `true`.

Calling the factory in a browser starts the runtime. It returns `{ setDark(isDark), destroy() }` (or `null` if the canvas 2D contexts or browser are unavailable). The caller **must call `destroy()` on unmount** to cancel RAF, disconnect observers, unregister events, destroy the tracer renderer and release canvas buffers. Repeated destruction is safe. The runtime observes changes to the root `dark` class and can also be updated through `setDark`.

The factory contains no `/music` pathname gate, `FieldModeProvider`, or persisted `performanceMode` toggle. It does not install itself on import and does not create a React component. It retains the original visual ornamentation as an optional future integration reference.

**Do not mount it as part of #53.** Future home reconstruction (#51, #68, #71) must first establish the protagonist mask/safe area, a single owner for RAF and time state, and a canvas stacking/lifecycle integration that does not duplicate the new homepage field clock. Do not restore the removed music page or obsolete performance switch.

## Checks

`components/field/SpectralFieldRuntime.test.ts` checks the detached API, legacy-route independence, SSR inertness and lifecycle cancellation when desktop rendering is disabled. `components/field/SpectralTracerLayer.test.ts` continues covering obstacle-aware drawing and both tracer layers. Full `lint`, `typecheck`, `test`, `build` and browser checks must pass before #72 is merged.
