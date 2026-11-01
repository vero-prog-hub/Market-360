# Final technical audit — Poorna Market

**Date:** 1 November 2026. This report records the original audit findings.

**Follow-up:** The selected P1 intro-reflow issue is now **resolved**. The intro scrolls independently when content exceeds the viewport, remains centered when it fits, and hides native VR/fullscreen controls until entry. Three targeted checks passed: keyboard/scroll access at 320×256, desktop centering and short-screen recovery access, and evening-toggle regression. The original audit score below is historical; the remaining minor findings have not been changed or rescored.

## Implementation integrity verdict

**Pass for product coherence; follow-up required for one isolated lifecycle defect.** The market is an internally consistent static A-Frame experience with 16 shop stops, six G+2 market buildings, a 44-building scenic neighborhood, four surrounding roads, bilingual signs, original local music, and persistent evening lighting. The requested identity remains intact.

The latest complete Playwright run passed **13/13 tests in 2.1 minutes**. The reported window-flicker cause is addressed by 0.2–300m camera clipping and exclusion of self-lit panes/lamp faces from shadow casting/receiving. A regression checks depth separation and unchanged emissive intensity across twelve frames with slight camera rotations. This is mathematical/render-state evidence plus visual capture, not an exhaustive pixel-level or physical-device guarantee.

## Audit health

These are reviewer scores against the Impeccable technical rubric, not Lighthouse scores or a WCAG certification.

| Dimension | Score | Evidence and remaining gap |
| --- | ---: | --- |
| Accessibility | 2/4 | Named native controls, Help focus, readable DOM stories and reduced motion work; short-viewport reflow loses access to intro content, and primary landmarks are missing. |
| Performance | 3/4 | Shared/instanced geometry, renderer caps and event-driven shadow refresh; original WAV remains a relatively large entry-time download. Physical-device frame rate is unmeasured. |
| Theming | 2/4 | Functional persistent Day/Evening state and preserved interface; renderer palettes and much CSS remain literal rather than consistently token-driven. |
| Responsive design | 2/4 | Normal desktop/tablet/mobile widths and synthesized touch pass; the 320×256 intro requires a scrolling/reflow fix. |
| Implementation integrity | 3/4 | All main flows pass; one-shot pagehide cleanup is consumed by a Back/Forward cache transition. |
| **Total** | **12/20 — Acceptable** | **One major accessibility/responsive fix, plus bounded minor follow-ups.** |

## Executive summary

**Five grouped findings: 0 P0, 1 P1, 3 P2, 1 P3.** The known issues do not invalidate the thirteen passing regression scenarios; the final audit deliberately checked additional states beyond those scenarios.

1. **P1:** short/high-zoom intro viewport hides the guided-entry action and supporting content.
2. **P2:** missing main/region landmarks impede landmark navigation.
3. **P2:** terminal cleanup is skipped after a persisted pagehide has consumed its one-shot listener.
4. **P2:** the background music is a 5.29MB PCM file decoded in full on entry.
5. **P3:** the design detector reports six existing documentation/token advisories.

## Detailed findings

### P1 at audit — Intro content cannot reflow or scroll in a short viewport — RESOLVED

- **Location:** `index.html:28` (`#intro`), `index.html:85` (intro markup).
- **Category:** Accessibility / Responsive.
- **Evidence:** At **320×256 CSS pixels**, body overflow is `hidden` and the fixed intro has `overflow: visible`. The title occupies y24–104; Enter the Market occupies y209.5–263.5 and is clipped; Guided market walk occupies y275.5–324.5, entirely below the viewport; the supporting note is y350.5–401.5. The screenshot confirms this. Browser evidence is in `artifacts/final-reflow.json` and `artifacts/final-reflow-320x256.png`.
- **Impact:** Visitors using a short viewport or high zoom cannot visually reach the guided-entry action or lower intro content. The floating native fullscreen/VR control also overlaps the lower entry area in this state.
- **Standard:** WCAG 2.2 SC 1.4.10 Reflow applies to these ordinary interface controls; the spatial scene's two-dimensional-layout exception does not justify clipping its entry UI. See the [W3C reflow explanation](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- **Recommendation:** Make the intro independently vertically scrollable and use safe/top alignment when its content exceeds available height. Ensure entry controls and the recovery link remain reachable, and keep the native VR/fullscreen control clear of intro actions. Preserve the theme.
- **Suggested command:** `$impeccable adapt`.

### P2 — Main content lacks semantic landmark containment

- **Location:** `index.html:85` (intro), `index.html:101` (brand/HUD), `index.html:123` (scene area).
- **Category:** Accessibility.
- **Evidence:** axe-core **4.14.0** reports the `region` best-practice rule on the intro heading/copy and canvas, and on the in-scene brand/instructions/canvas in both day and evening. Help has no automatically detected violation in the tested state.
- **Impact:** Screen-reader users cannot navigate directly to the main experience by landmark. Named buttons, story status text and tour navigation remain available.
- **Standard:** Semantic landmark/navigation best practice; this finding alone is not presented as a confirmed WCAG AA failure.
- **Recommendation:** Provide one named main landmark for the active experience, retain the existing named tour navigation, and group the HUD with appropriate semantics. Keep the inactive intro out of the active reading path. Validate with a screen reader.
- **Suggested command:** `$impeccable harden`.

### P2 — Back/Forward cache can consume terminal cleanup

- **Location:** `js/app.js:100`–104.
- **Category:** Implementation integrity.
- **Evidence:** The pagehide handler returns for `event.persisted`, but is registered with `{once:true}`. A synthetic browser lifecycle probe dispatched persisted pagehide followed by terminal pagehide: scene `isPlaying` remained **true → true → true**, confirming the second event did not execute cleanup. Expected terminal state is paused. Evidence: `artifacts/final-accessibility.json`, `checks.lifecycle`.
- **Impact:** After returning through a cached page, the application-specific render/audio/GPU cleanup will not run on the later terminal navigation. Eventual browser resource reclamation remains available; this is not evidence of a measured persistent memory leak.
- **Recommendation:** Keep the listener registered across persisted transitions and remove it only after terminal cleanup, or register a lifecycle handler that is safe for repeated transitions. Add a persisted-then-terminal regression. Preserve cached state when returning.
- **Standard:** Browser lifecycle correctness; no WCAG claim.
- **Suggested command:** `$impeccable harden`.

### P2 — Music payload is large for mobile entry

- **Location:** `js/audio.js:13`; `assets/audio/poorna-golden-hour.wav`.
- **Category:** Performance.
- **Evidence:** The 60-second stereo PCM file is **5,292,044 bytes**. Playback fetches the complete ArrayBuffer and decodes it before creating the looping source. It is correctly deferred until user entry and failure does not block exploration.
- **Impact:** Slow/mobile connections spend additional data and wait longer for music, despite the 3D scene already being usable.
- **Recommendation:** Encode the approved original composition in a browser-compatible compressed format, retain smooth looping/fades, update provenance/tests and verify supported browsers. Do not substitute another recording or change the composition without authorization.
- **Standard:** Asset delivery/perceived-performance best practice; no frame-rate or accessibility failure is inferred.
- **Suggested command:** `$impeccable optimize`.

### P3 — Existing design documentation/token gaps

- **Location:** `index.html:17`, `index.html:18`, `index.html:29`, `index.html:51`, `index.html:58`.
- **Category:** Theming / Implementation integrity.
- **Evidence:** The mechanical detector reports six advisories: colors `#e8d4c5`, `#ffe0a1`, `#ff9f1c66`, `#0008`, and type sizes `12px`, `22px` are absent from the current extracted token inventory. These are incumbent values, not newly discovered visual failures. Full output: `artifacts/final-detector.json`.
- **Impact:** Future changes may misinterpret approved styles as undocumented drift. Runtime appearance remains intact.
- **Recommendation:** Reconcile the token inventory with approved incumbent values in a deliberate documentation pass; avoid changing the theme simply to satisfy the detector.
- **Suggested command:** `$impeccable document`.

## Fresh verification results

### Full regression suite — 13 passed

- Local-only startup with external HTTPS requests blocked; all sixteen tour positions and wraparound.
- Walking, repeated/interrupted glides, actual ground and shop raycasts, bounds.
- Help focus containment, Escape/return focus, motion control, movement paused in Help.
- Missing-engine recovery; AudioContext failure; actual music decode, volume/mute persistence, visibility suspension/resumption and failed-download retry.
- Desktop/mobile overflow and touch targets; Chromium CDP synthesized touch drag and touchscreen tap. This is emulation, not physical-device evidence.
- Six G+2 metadata checks, sixteen shop hits, thirteen category types, local font load, eighteen flower borders, three petal carpets.
- Evening material/light changes, saved-mode restoration and keyboard Space activation without changing the tour position.
- Day/evening neighborhood captures at 1440×900, 390×844 and a 320×640 control-overlap check.
- Window depth separation, stable emission values and disabled self-shadowing across twelve frames of camera movement.

### Additional audit probes

- axe-core 4.14.0: intro, day shop, evening shop and Help. One distinct automatically detected best-practice violation (`region`), occurring across the first three states. Help: no detected violation.
- Axe marked **color contrast incomplete** across the gradient/transparent/canvas-backed surfaces. Incomplete is not a pass and not a confirmed contrast violation; pixel-based/manual evaluation remains necessary.
- Additional widths 320×640, 768×1024 and 1440×900 showed no horizontal overflow; HUD buttons measured at least 44×44px. The separate 320×256 reflow probe found P1 above.
- Page-lifecycle probe confirmed the cache/terminal handler issue. This probe used dispatched browser events, not a physical Back/Forward cache eligibility test.
- Full-suite initial-view renderer snapshot: **242 calls, 970,026 triangles**. A closer shop probe observed **113 calls, 732,528 triangles**, with **24-bit depth**, 26 textures and 13 geometries; counts depend on view. No physical-device FPS claim is made.
- `git diff --check` passes. The application remained unchanged by this audit; only reports/ignored audit artifacts were written.

## Patterns and positive foundations

The remaining gaps cluster around unusual lifecycle/viewport states and documentation, rather than broken main exploration. Dynamic transparent/canvas surfaces also limit automated accessibility certainty.

Preserve the functional sixteen-stop tour, native button/dialog semantics, readable DOM stories, named toggle states, local font/assets, user-triggered audio, graceful audio failure, manual/reduced-motion controls, instanced geometry, renderer resolution caps, static shadow updates and the camera-depth flicker correction. The prior independent visual reviewers approved the core market and neighborhood/evening extension; those verdicts are visual evidence, not substitutes for this technical audit.

## Prioritized follow-up

1. **P1 — `$impeccable adapt`:** fix intro scrolling/safe alignment and add a short-viewport/high-zoom regression.
2. **P2 — `$impeccable harden`:** add landmarks and correct the persisted/terminal page lifecycle.
3. **P2 — `$impeccable optimize`:** compress the original music and verify loop/playback behavior.
4. **P3 — `$impeccable document`:** reconcile the six incumbent token advisories.
5. **`$impeccable polish`:** final consistency check after the specific fixes, preserving the approved theme.

These can be run individually or together. Re-run `$impeccable audit` after fixes to update the score.

## Remaining validation limits

No physical headset/controller, Safari/iOS, screen-reader session, physical mobile GPU performance test, physical touch-cancellation test or fluent Telugu linguistic review was completed. The synthetic music has decode/signal checks and accurate provenance, but no independent listening/authenticity evaluation. This audit is not a penetration test, formal accessibility certification or building-code assessment. Nothing was pushed or deployed.
