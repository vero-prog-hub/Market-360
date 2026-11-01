# Modern Poorna Market — implementation audit

Date: 1 November 2026. Source repository: `vero-prog-hub/Market-360`, original base `01f2de0`. Changes remain local; nothing pushed or deployed.

## Result and scope

The repaired single-page flower market has been rebuilt into a modern artistic market streetscape with the original plum/gold interface. This is a stylized architectural visualization with semi-realistic materials and architectural detail, not a photographic replica, measured survey, or construction-code certification.

The user approved an original locally generated tabla/flute-style composition after the planned Pixabay recording was unavailable behind a normal browser challenge. The blocked recording is not included. `assets/README.md` documents provenance and the reproducible composition source.

## Delivered requirements

| Requirement | Implementation / evidence |
| --- | --- |
| Flower walkways | 18 terracotta flower-border planters, three petal carpet sections, flat rangoli accents; central 6.2m walking envelope remains clear. |
| Modern Indian street with traditional character | Stone paving, drainage grates, recessed thresholds, awnings, timber and woven materials, bilingual signs, garlands, shaded benches and trees. |
| Six three-storey buildings | Three on each side, each with ground-floor shop plus two upper floors, balcony rails, shaded windows, parapets, modest rooftop equipment and planters. |
| Sixteen shop stops | Four flower shops, vegetables, fruit/coconuts, bamboo crafts, pottery, puja, spices, textiles, groceries, tea, sweets, utensils, baskets/coir. |
| Recognizable merchandise | Flower trays/strings; produce crates; bamboo poles/screens/stools; clay pots/diyas; lamps; spice sacks; hanging/folded textiles; provisions; kettle/chai; sweets trays; metal vessels; woven baskets/mats. |
| Local character | Locally bundled Noto Sans Telugu, Telugu/English shop signs, original entrance arch and terminal shrine refined in masonry/wood/terracotta. Names describe fictional scene shops, not verified real businesses. |
| Exploration | Mouse/touch looking, keyboard walking, ground gliding, real mesh-based shop hits, 16-stop wrapping tour with open viewpoints. |
| Sound | Original 60-second local PCM loop, user-initiated playback, gentle gain ramps, mute, volume persistence, hidden-tab suspension and retry state. |
| Accessible interaction | Native Help dialog, keyboard focus/return, named buttons and range input, story/status announcements, visible focus, reduced-motion and manual motion control. |

## Functional verification

**Full browser suite: 10 passed.** Microsoft Edge/Chromium, desktop 1440×900 and mobile emulation 390×844. After the independent review's textile correction, the targeted visual-capture check was rerun.

1. Render with all external HTTPS requests blocked: local engine, fonts and music; no page errors; all 16 tour stops and wraparound positions verified.
2. Walking, interrupted/repeated glides, real ground raycasting, real shop raycasting, street bounds.
3. Help focus containment, Escape/return focus, motion control, suspended walking in Help, sound labels/state.
4. Missing engine recovery; AudioContext failure without blocked exploration.
5. Responsive HUD targets of at least 44px, no tested-width horizontal overflow, synthesized touch drag and touchscreen tap.
6. Dynamic reduced-motion preference: falling petals hidden and glide animation removed.
7. Architecture/category metadata, local font availability and render submission budget.
8. Music load, 60-second buffer, volume adjustment/persistence, mute/unmute and hidden-tab suspend/resume.
9. Failed audio request, working shop tour during failure, successful user-triggered retry.
10. Representative visual captures for produce, bamboo, pottery, textiles, tea, sweets, utensils and baskets/coir.

Audio file checks: 60.0 seconds, stereo 16-bit/22,050Hz, peak 0.7599, RMS 0.1442, zero clipped samples. Loop-boundary sample step 0.00348. These checks and browser playback assertions do not replace a subjective listening review.

## Performance and maintainability

- The stable desktop frame reported **210 draw calls and 880,288 triangles** in the test browser. This is rendering evidence, not a physical-device frame-rate claim.
- Primitive geometry/materials are shared and instanced across architecture, flowers, produce and petals. No separate DOM element is created for every flower.
- Material maps are deterministic local canvas textures. Bilingual lettering waits for the local font. No CDN is required at runtime.
- Rendering resolution is capped at 1.5× desktop and 1.25× coarse-pointer devices. Architectural shadows use a static map rather than recomputing every frame.
- Shop data, scene generation, A-Frame components, application interactions and audio are separated in `js/` without adding a frontend framework or backend.
- Audio starts only after user entry, and failures never block the scene. Browser storage is optional and guarded.
- Geometry, textures, materials, timers and the audio context are released on terminal page teardown; browser-history cached pages retain their state.

## Visual and guidelines review

The first batched desktop/mobile inspection corrected shop viewpoints, sign framing, ground-flat rangoli and planter/bench placement. An independent finish reviewer then opened all seven interface captures and eight representative shop captures and identified one material issue: hanging textiles obscured the English sign. The display was lowered/shortened below the sign and recaptured. The same reviewer confirmed the issue **resolved** and returned **ship**, subject to its stated verification limits.

Reviewed against the current Vercel Web Interface Guidelines. The mechanical Impeccable detector returned `[]` over the changed HTML and JavaScript. Existing narrow exceptions for the original heading gradient and CTA colored shadow remain intentional, honoring the user's explicit theme constraint. No other rules were suppressed.

```text
index.html — pass: labelled controls, native dialog, visible focus, motion/volume settings, local fonts
js/app.js — pass: loading/recovery, 16-stop navigation, independent audio failures, keyboard/focus behavior
js/audio.js — pass: user-initiated playback, named retry state, volume and background suspension
js/scene.js — corrected: textile display now remains below the bilingual shop sign
```

The independent reviewer characterizes the visual result as a coherent artistic market experience with recognizable categories and readable interface coverage. The final correction verdict is recorded in `.impeccable/review/finish.md`.

## Remaining verification limits

- No physical headset/controller, iOS/Safari, physical touch-cancellation, screen-reader session or mobile GPU profiling was available.
- Synthesized Chromium touch and responsive viewports establish interaction/layout behavior, not performance on an actual phone.
- Telugu text is visibly rendered; linguistic accuracy has not been independently validated by a fluent reviewer.
- Audio playback/decode and numeric signal checks passed; subjective musical authenticity/listening quality has not been independently reviewed. The interface accurately calls it an original instrument-inspired composition.
- The scene intentionally remains free of checkout, shop interiors, traffic and moving crowds.

No known blocking issue remains in the tested browser flows. Future changes should preserve the existing tour/Help/motion/audio regression checks and include physical-device testing before claiming broad WebXR/mobile compatibility.


## Surrounding neighborhood and evening extension

The user requested buildings/streets around the isolated market and an evening toggle. Added 44 scenic background buildings in adjoining blocks, two parallel side roads and two cross streets, footpaths/crossings, trees, bins and street lamps. Return windows on the entrance buildings complete their previously blank elevations. A separately scaled paving map joins the market approach to the cross street. These surrounding streets remain scenery; no new tour stops or movement-bound changes were introduced.

The accessible moon button toggles Day/Evening and stores the selected mode in guarded local storage. Evening replaces the sky map, adjusts hemisphere/sun/fog colors and intensities, exposes a moon, lights emissive windows/shop/garland/street lamps and enables two fixed-budget local point lights plus warm fill. Geometry is retained across toggles; position, shop selection and audio continue. Shadow maps refresh once per switch. Mobile uses a labelled 44px icon button; the 320px layout is checked for brand/control overlap.

Browser verification covers scene data, real light/material changes, keyboard Space activation, saved-mode restoration, unchanged tour position, and desktop/mobile day/evening views looking into the market, sideways and back toward the cross street. Initial full suite: ten tests passed and two checks required rechecking. The toggle test originally compared position during an active guided glide; it now isolates lighting under reduced motion. The audio retry check allowed too little time for local audio decoding under load; it now allows 15 seconds. The targeted audio retry and lighting checks passed after those test corrections. Final neighborhood capture verification is recorded in the review evidence.

Performance snapshot from the full suite: 241 main-frame draw calls / 970,026 triangles before the final separately batched approach paving map (one additional material batch). These numbers do not establish physical-device FPS. No external runtime assets or rendering libraries were added.

The design detector reported only pre-existing documentation advisories for incumbent CSS colors/sizes omitted by the previous design extraction. Those were left standing; no broad ignores or unrelated visual changes were introduced. Existing gradient/glow exceptions remain unchanged.


Final extension verification: the independent `neighborhood_finish_reviewer` returned **ship**, finding no material visual defect in nine desktop/mobile/320px captures. The final capture check passed (25.1 seconds) after terminal page teardown was corrected to pause the scene and stop its render loop before disposing GPU resources. Earlier screenshot assertions had completed but browser-context shutdown timed out; this cleanup issue is resolved. The visual-only capture test isolates audio, which is covered by separate real decode/retry tests. The audio retry and persistent lighting checks both passed their targeted rechecks. All twelve unique browser scenarios are verified across the initial run and targeted reruns; this is not a claim of a single fresh full-suite green run. JavaScript syntax, design JSON parsing and `git diff --check` pass. The preview at port4177 serves the updated files. No push or deployment was performed.


## Building-light flicker correction

The camera was using A-Frame's default near/far planes (0.005m / 10,000m), wasting depth precision and allowing thin window surfaces and their frames to compete at distance. Clipping is now 0.2m / 300m, retaining the full visible neighborhood and sky while separating a representative 35mm facade offset by more than four 24-bit depth steps through 150m. Self-lit window and lamp faces no longer cast or receive shadows against their enclosing frames; surrounding architecture still casts shadows.

Two targeted browser tests passed: persisted evening switching, and light stability/depth separation across twelve frames with small camera rotations. A final evening capture was visually inspected. Physical-device validation remains outside this test evidence.


## Latest final audit

See [FINAL_AUDIT.md](FINAL_AUDIT.md) for the fresh 13/13 regression run, axe/reflow/lifecycle probes, scored findings and release follow-ups. That report supersedes earlier broad statements about remaining blocking issues; it identifies a short-viewport entry accessibility issue that was outside the existing regression suite. No application changes were made during the final audit.


## Intro reflow follow-up

The user selected the P1 intro issue for repair. The fixed intro now uses an independently scrollable flex container with automatic block margins: it stays centered when space permits and starts at accessible top padding when content is taller. Native VR/fullscreen controls are hidden until market entry and hidden again on the error/recovery screen. Three targeted browser checks passed, including 320×256 keyboard access to both entry actions and lower notes, recovery-link access, retained desktop centering, and evening persistence. Captures: artifacts/fixed-intro-320x256.png and artifacts/fixed-intro-desktop.png. Other final-audit findings were left unchanged.
