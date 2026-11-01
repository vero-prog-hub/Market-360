---
name: Poorna Market
description: A warm modern regional Indian market with traditional character.
colors:
  gold: "#ffc94d"
  ink: "#2a0e1c"
  rose: "#e63979"
  plum-deep: "#1a0614"
  plum-intro: "#3b0f2a"
  cta-gold: "#ffb703"
  cta-orange: "#ff7b3d"
  title-pink: "#ff6fae"
  white: "#ffffff"
  glass-plum: "#2a0e1ccc"
  glass-border: "#ffffff22"
  ghost-white: "#ffffff1a"
  ghost-border: "#ffffff44"
  sign-cream: "#fff4d6"
  sign-gold: "#f3cd85"
  sign-frame: "#b99458"
  plaster-texture: "#e8dfcb"
  wood-texture: "#795238"
  paving-grout: "#857e6d"
  bamboo-texture: "#bea16c"
  terracotta-planter: "#a96b4e"
  foliage: "#65825a"
  daylight: "#ffdfb2"
  haze: "#ded4bd"
  evening-sky: "#202b50"
  evening-horizon: "#e8b18a"
  evening-haze: "#796b7c"
  window-lamp-glow: "#ffd39a"
typography:
  display:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "clamp(40px, 9vw, 88px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: ".02em"
  intro-body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "clamp(15px, 2.4vw, 19px)"
    lineHeight: 1.5
  title:
    fontFamily: "Georgia, serif"
    fontSize: "20px"
    fontWeight: 600
  hud:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "14px"
  primary-label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "18px"
    fontWeight: 700
  lighting-label:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    fontSize: "13px"
  telugu-sign:
    fontFamily: '"Market Telugu"'
    fontSize: "54px"
  english-sign:
    fontFamily: "Georgia"
    fontSize: "45px"
    fontWeight: 500
rounded:
  pill: "999px"
  circle: "50%"
  story: "18px"
  help: "20px"
spacing:
  tour-inset: "6px"
  control-gap: "8px"
  row-gap: "12px"
  hud-edge: "14px"
  page-inset: "24px"
components:
  button-primary:
    textColor: "{colors.ink}"
    typography: "{typography.primary-label}"
    rounded: "{rounded.pill}"
    padding: "15px 34px"
  button-ghost:
    backgroundColor: "{colors.ghost-white}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "13px 22px"
  button-tool:
    backgroundColor: "{colors.glass-plum}"
    textColor: "{colors.white}"
    rounded: "{rounded.circle}"
    width: "44px"
    height: "44px"
  button-lighting:
    backgroundColor: "{colors.glass-plum}"
    textColor: "{colors.white}"
    typography: "{typography.lighting-label}"
    rounded: "{rounded.pill}"
    padding: "0 13px"
    height: "44px"
  button-lighting-selected:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.ink}"
  tour:
    backgroundColor: "{colors.glass-plum}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "{spacing.tour-inset}"
  story-card:
    backgroundColor: "{colors.glass-plum}"
    textColor: "{colors.white}"
    rounded: "{rounded.story}"
    padding: "16px 20px"
    width: "min(440px, 92vw)"
  help:
    backgroundColor: "{colors.glass-plum}"
    textColor: "{colors.white}"
    rounded: "{rounded.help}"
    padding: "24px 28px"
---

# Design System: Poorna Market

## Overview

**Creative North Star: "Poorna Market at Golden Hour"**

A modern regional Indian streetscape with traditional character: warm stone and plaster, shaded shopfronts, local crafts and flowers. This is an artistic, stylized architectural visualization, not a photographic or measured reconstruction. The durable visual authority is the user-approved built implementation; there is no approved image comp or comp-led build.

The plum-and-gold introduction welcomes visitors with a warm title gradient and rounded actions. Inside the market, translucent plum controls recede around the architecture. The six G+2 buildings sit among sixteen distinct shops; bilingual signs, flower borders, selected petal carpets, stone paving, an entrance arch and a terminal shrine make the place recognizable without asserting documentary accuracy. The North Star names the existing atmosphere; it introduces no new visual direction.

**Key Characteristics:**
- Modern masonry and traditional craft materials in warm daylight.
- Local Telugu lettering paired with English shop identities.
- Plum glass controls, gold emphasis and a warm gradient welcome.
- An open walking lane with flowers at the edges and grounded petal patterns.

## Colors

The normative frontmatter records reusable interface colors and representative procedural material colors from the built scene; individual shop merchandise retains its own observed colors in scene data.

### Primary

Gold marks actions, headings, focus and tour controls against plum ink. The introduction uses deep and lighter plum behind radial orange/rose atmosphere. Its display gradient runs from CTA gold through CTA orange to title pink; the main action retains the approved gold-to-orange gradient. These gradients are intentional parts of the incumbent identity.

### Secondary

Sign cream, sign gold and the muted sign frame carry bilingual lettering on plum. Terracotta planters, foliage and woven bamboo support the regional material character. Shop accent colors belong to their specific awnings and goods rather than a new global accent hierarchy.

### Neutral

White supports interface reading. Translucent plum, ghost white and their respective pale borders layer controls over the scene. Plaster texture, wood texture and paving grout anchor procedural surfaces; warm daylight and haze tie the street together. Material colors multiply texture maps and lighting, so they are not flat screen-color promises.

Evening keeps the plum interface intact while the scene shifts to a cool sky, warm horizon, muted haze and illuminated windows/lamps. The added evening tokens record representative actual sky stops, fog and shared emissive color; the complete sky gradient remains in `js/scene.js`. Day remains the default.

## Typography

Georgia gives the title, shop-story headings and English signage a familiar, warm serif voice. System UI fonts keep controls and descriptions compact and readable. Preserve these installed stacks.

The display role belongs to the introduction, with responsive size and tight leading. Intro body copy stays within (34ch); story headings use the title role, and the HUD uses the compact system role. The brand uses Georgia at inherited HUD size, semibold weight and (.03em) tracking. Story descriptions use (1.45) line height; Help uses (1.8).

The local Noto Sans Telugu Regular file is exposed as **Market Telugu**. Load it before drawing bilingual canvas signs. The sign roles are canvas rasterization sizes, not DOM text sizes: Telugu occupies the upper line and English the lower line of a (1024 × 256) texture. Preserve shaping and keep goods below the lettering; the textile display has already been lowered to keep its sign visible. The in-world VR story panel uses bundled Roboto MSDF assets.

## Layout

The scene fills the viewport. The introduction centers a concise title, description and wrapping action row when space permits. On short screens it scrolls independently with top-accessible content; automatic flex margins preserve centering without clipping. Native VR/fullscreen entry controls remain hidden until the market is entered. The brand anchors at the upper left; sound and Help sit at the upper right. Safe-area insets protect top controls and the bottom tour. A centered story card sits above the bottom tour, and a temporary instruction toast occupies the upper center.

The tour and toast cap at (92vw); the counter truncates rather than widening the controls beyond the viewport. At (480px) and below, the brand becomes more compact, the toast becomes a broad rounded panel and the secondary action loses its left margin. Help is a native modal with a scrollable inner panel capped at (90dvh). Music volume uses an inline label/range/output grid.

Responsive framing also belongs to the architecture: the camera field of view widens from (68°) to (88°) at viewport widths up to (600px). The tour places the visitor inside the clear lane and turns toward each shop. It wraps through all sixteen shops. Keep both the selected frontage and its bilingual sign legible on narrow screens.

The street has repeated alternating shop bays, three taller bay pairs and a continuous stone route. Flower borders and occasional benches/trees frame the lane; sparse garlands punctuate overhead space. Selected carpets and rangoli sit on actual paving. The entrance arch and terminal shrine provide a readable beginning and end.

The surrounding neighborhood adds (44) scenic residential/shop buildings and (4) connecting roads with footpaths, trees and lights through `js/neighborhood.js`. These form town context around the existing interactive market route. The entrance apron uses a separate paving texture repeat of (8 × 4), while the long market street retains (3 × 28); preserve their distinct scale and proportion.

## Elevation & Depth

Interface depth comes from translucent plum, fine pale borders, backdrop blur and soft dark shadows. The primary action adds a warm glow and small hover lift. These treatments sit over a genuinely modeled street rather than substituting for architecture. Exact shadow and motion values live in the sidecar.

The scene uses warm directional sunlight, hemisphere fill, linear haze, procedural surface grain, recessed shop openings, balconies, railings and contact shadows. Rough plaster and timber contrast with restrained reflective steel/brass and muted glass. Static soft shadows support the architecture without continuous shadow-map refresh. Day/Evening switches instantly, without animation: sky texture, fog, hemisphere and directional sunlight change together; a moon becomes visible, windows and lamps become emissive, and two fixed point lights plus a warm directional fill illuminate the street. Refresh the static shadow map once per switch.

## Shapes

Interface actions, branding and tour navigation use pills; small tool and tour buttons use circles. Story and Help panels soften into larger rounded rectangles. Gold focus outlines sit outside the controls.

The street uses rectilinear masonry, slender columns, balcony slabs, framed awnings and recessed shopfronts. Pots, bowls, flowers, garlands and the tiered shrine add curves and traditional silhouettes. This balance is specific to the built market; it is not a prohibition on other geometries in future surfaces.

## Components

### Buttons

The primary action uses the warm approved gradient, ink text, pill silhouette and orange glow. Hover lifts it slightly and scales it; reduced motion removes the transform. The ghost action uses translucent white with a pale border and lighter blur. Preserve the visible gold focus treatment. Loading disables entry actions until rendering is ready; failure exposes readable status and a reload action.

### Day/Evening Control

The upper-right moon button (`#lighting`) uses a glass pill with a (13px) Evening label and inline (19px) SVG icon. At (480px) and below, the label hides and the control becomes a centered (44px) icon target; the brand truncates to leave room. The selected evening state uses gold with ink text and `aria-pressed="true"`. The tooltip describes the next action. Persist the choice under `poorna-time-of-day`; a fresh visit defaults to day. Switching preserves the tour position and audio state.

### Navigation

The glass tour capsule holds gold previous/next buttons and a single-line shop counter. Tour and tool buttons resolve to a minimum (44px × 44px) despite earlier base declarations of smaller sizes. Keep descriptive accessible names, and let the counter truncate before shrinking targets. Shop selection updates both the story card and tour label.

### Cards / Containers

The story card uses gold Georgia headings and compact system descriptions over plum glass. It appears through opacity and a short upward movement. Its live status text makes stories available outside the 3D geometry. In VR, a separate world-facing panel presents the same story.

### Help and Inputs

The Help modal pauses walking controls and gliding while open and returns focus to Help on close. Preserve its motion checkbox, music range, percentage output and audio status. Native inputs inherit the gold accent; Help labels have a minimum touch-row height of (44px). Volume starts at (30%).

### Scene and Sound

Wait for the local Telugu font before drawing signs. Keep shop goods distinctive and sign faces clear. Shared geometries and material batches become instanced meshes; deterministic canvas textures provide plaster, wood, woven bamboo, paving and contact shadows. Keep this visual density economical rather than replacing it with thousands of separate entities.

Camera clipping uses a 0.2m near plane and 300m far plane to retain depth precision for thin window faces. Self-lit panes and lamp faces do not cast or receive shadows against their surrounding frames.

Renderer canvas limits are (1920 × 1440). Pixel ratio caps at (1.25) for coarse pointers and (1.5) otherwise. Soft shadow maps update at initial rendering and after an explicit lighting-mode switch. Dispose geometries, materials, textures and audio resources when leaving the page, respecting back-forward cache persistence.

Motion preference disables animated petals and gliding; the Help checkbox also changes them. Enabled gliding uses a (1000ms) ease-in-out cubic movement; VR movement preserves tracked head orientation and moves immediately. Keep reduced-motion CSS for introduction, story card and CTA.

The original local **Golden Hour** loop is a synthetic tabla-and-flute-inspired composition, approved after the Pixabay download was blocked. Keep that honest attribution in Help. It is not a recording of live performers. Sound starts with entry, supports mute/retry and volume, and an unavailable track never blocks exploration.

## Do's and Don'ts

### Do:
- **Do** preserve the approved plum/gold gradients, Georgia/system typography and local Telugu signage.
- **Do** keep shop goods distinct, bilingual signs visible and the central walking lane clear.
- **Do** retain narrow-screen tour framing, safe-area placement, readable stories and reachable controls.
- **Do** preserve motion choice, volume controls and the original composition's honest attribution.
- **Do** carry procedural materials, instancing and renderer caps forward when extending the streetscape.

### Don't:
- **Don't** present the stylized market as a photographic or measured reconstruction.
- **Don't** allow merchandise, including hanging textiles, to obscure the shop signs.
- **Don't** make exploration depend on successful audio playback.
- **Don't** replace approved gradients or font stacks as an incidental documentation or refinement change.
