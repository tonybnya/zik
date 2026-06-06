---
version: "alpha"
name: "Lesson Loom Signal Scanner"
description: "Lesson Loom Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#EAD9BD"
  secondary: "#EF8B3C"
  tertiary: "#F1E4CA"
  neutral: "#FFFFFF"
  background: "#FDF8EE"
  surface: "#EAD9BD"
  text-primary: "#B08560"
  text-secondary: "#704A2B"
  border: "#704A2B"
  accent: "#EAD9BD"
typography:
  display-lg:
    fontFamily: "JetBrains Mono"
    fontSize: "60px"
    fontWeight: 100
    lineHeight: "60px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: "16px"
    letterSpacing: "0.25em"
  label-md:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "1.8px"
rounded:
  md: "8px"
spacing:
  base: "4px"
  sm: "1px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  gap: "4px"
  card-padding: "9px"
  section-padding: "24px"
components:
  button-primary:
    textColor: "#A37753"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0px"
  card:
    backgroundColor: "{colors.tertiary}"
    rounded: "12px"
    padding: "10px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Open
  - Grid: Strong

## Colors

The color system uses light mode with #EAD9BD as the main accent and #FFFFFF as the neutral foundation.

- **Primary (#EAD9BD):** Main accent and emphasis color.
- **Secondary (#EF8B3C):** Supporting accent for secondary emphasis.
- **Tertiary (#F1E4CA):** Reserved accent for supporting contrast moments.
- **Neutral (#FFFFFF):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #FDF8EE; Surface: #EAD9BD; Text Primary: #B08560; Text Secondary: #704A2B; Border: #704A2B; Accent: #EAD9BD

## Typography

Typography relies on JetBrains Mono across display, body, and utility text.

- **Display (`display-lg`):** JetBrains Mono, 60px, weight 100, line-height 60px, letter-spacing -0.025em.
- **Body (`body-md`):** JetBrains Mono, 12px, weight 300, line-height 16px, letter-spacing 0.25em.
- **Labels (`label-md`):** JetBrains Mono, 12px, weight 400, line-height 16px, letter-spacing 1.8px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 1px, 4px, 6px, 8px, 10px, 16px, 24px, 88px
- **Section padding:** 24px
- **Card padding:** 9px, 10px, 13px, 24px
- **Gaps:** 4px, 6px, 8px, 12px

## Elevation & Depth

Depth is communicated through elevated, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as elevated first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Elevated
- **Borders:** 1px #704A2B; 1px #EF8B3C
- **Shadows:** rgba(176, 133, 96, 0.6) 0px 0px 2px 0px inset, rgba(255, 255, 255, 0.7) 0px 1px 0px 0px; rgba(239, 139, 60, 0.6) 0px 0px 6px 0px; rgba(176, 133, 96, 0.25) 0px 2px 4px 0px, rgba(255, 255, 255, 0.9) 0px 1px 0px 0px inset, rgba(176, 133, 96, 0.15) 0px -1px 2px 0px inset

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 26px radius. Drive the shell with linear-gradient(rgba(255, 255, 255, 0.95) 0%, rgba(239, 139, 60, 0.25) 50%, rgba(176, 133, 96, 0.35) 100%) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 6px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 6px, 8px, 12px, 25px, 26px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Primary:** text #A37753, radius 8px, padding 0px, border 0px none rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background #F1E4CA, border 0px solid rgb(229, 231, 235), radius 12px, padding 10px, shadow rgba(176, 133, 96, 0.4) 0px 4px 12px 0px inset, rgba(176, 133, 96, 0.5) 0px 0px 0px 1px inset, rgba(255, 255, 255, 0.8) 0px 1px 1px 0px.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Elevated surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 6px, 8px, 12px, 25px, 26px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 100ms and 150ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on transform changes.

**Motion Level:** moderate

**Durations:** 100ms, 150ms, 300ms, 200ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1), ease-out

**Hover Patterns:** transform

## WebGL

Reconstruct the graphics as a full-bleed background field using webgl, renderer, alpha, dpr clamp, custom shaders. The effect should read as retro-futurist, technical, and meditative: dot-matrix particle field with blue on soft amber and dense spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve reduced motion + dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** ThreeJS, WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, Renderer, alpha, DPR clamp, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <div class="relative flex-1 rounded-[8px] overflow-hidden min-h-[300px]" style="background:#fffaf0; box-shadow: inset 0 0 40px rgba(239,139,60,0.08), inset 0 0 0 1px rgba(255,255,255,0.6);">

        <canvas id="matrix-canvas" class="absolute inset-0 w-full h-full z-[1]"></canvas>

        <div id="scanline" class="absolute top-0 bottom-0 w-[80px] z-[8] pointer-events-none" style="left:-80px; background: linear-gradient(90deg,…
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function initBackgroundShader() {
        const host = document.getElementById('shader-bg');
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      …
      ```
  - **Interaction hook:**
    - **Language:** js
    - **Snippet:**
      ```
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.domElement.className = 'fixed inset-0 w-full h-full pointer-events-none';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      function initBackgroundShader() {
        const host = document.getElementById('shader-bg');
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.className = 'fixed inset-0 w-full h-full pointer-events-none';
      …
      ```
  - **Draw call:**
    - **Language:** js
    - **Snippet:**
      ```
      };

        const fragmentShader = `
          precision highp float;
          uniform vec2 u_resolution;
          uniform float u_time;
          uniform vec2 u_pointer;
      …
      ```

## ThreeJS

Reconstruct the Three.js layer as a full-bleed background field with layered spatial depth that feels retro-futurist and technical. Use alpha, dpr clamp renderer settings, orthographic projection, plane geometry, shadermaterial materials, and ambient + key + rim lighting. Motion should read as slow orbital drift, with reduced motion + non-3d fallback.

**Id:** threejs

**Label:** ThreeJS

**Stack:** ThreeJS, WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field with layered spatial depth
  - **Render:**
    - **Value:** alpha, DPR clamp
  - **Camera:**
    - **Value:** Orthographic projection
  - **Lighting:**
    - **Value:** ambient + key + rim
  - **Materials:**
    - **Value:** ShaderMaterial
  - **Geometry:**
    - **Value:** plane
  - **Motion:**
    - **Value:** Slow orbital drift

**Techniques:** Shader materials, Timeline beats, alpha, DPR clamp, Reduced motion + non-3D fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <div class="relative flex-1 rounded-[8px] overflow-hidden min-h-[300px]" style="background:#fffaf0; box-shadow: inset 0 0 40px rgba(239,139,60,0.08), inset 0 0 0 1px rgba(255,255,255,0.6);">

        <canvas id="matrix-canvas" class="absolute inset-0 w-full h-full z-[1]"></canvas>

        <div id="scanline" class="absolute top-0 bottom-0 w-[80px] z-[8] pointer-events-none" style="left:-80px; background: linear-gradient(90deg,…
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      function initBackgroundShader() {
        const host = document.getElementById('shader-bg');
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      …
      ```
  - **Interaction hook:**
    - **Language:** js
    - **Snippet:**
      ```
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.domElement.className = 'fixed inset-0 w-full h-full pointer-events-none';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.appendChild(renderer.domElement);
      ```
  - **Renderer setup:**
    - **Language:** js
    - **Snippet:**
      ```
      function initBackgroundShader() {
        const host = document.getElementById('shader-bg');
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.className = 'fixed inset-0 w-full h-full pointer-events-none';
      …
      ```
  - **Draw call:**
    - **Language:** js
    - **Snippet:**
      ```
      };

        const fragmentShader = `
          precision highp float;
          uniform vec2 u_resolution;
          uniform float u_time;
          uniform vec2 u_pointer;
      …
      ```
