# Breakthrough: Representation Engineering

## The Discovery

After 40+ failed attempts to build a minecraft diamond sword directly in Blender from text descriptions and reference images, we discovered that adding an html-canvas preview step as an intermediate layer made the translation work perfectly on the first try.

## ClawBot's Self-Analysis (verbatim, April 3)

**Why direct image/text to Blender is harder:**

- Underspecified mapping: image/text says "what it should look like," not exact per-face occupancy
- Too many degrees of freedom at once: shape, orientation, scale, materials, topology all move together
- Local edits have global side effects in Blender (especially late in iteration)

**Why HTML-canvas grid worked:**

1. Shared coordinate system: converted "looks like" into explicit (x,y) cell truth
2. Reduced ambiguity: each pixel decision became binary (present/absent + material class)
3. Fast visual approval loop: canvas is cheap to iterate, Blender changes are expensive
4. Deterministic transfer: once approved, Blender step becomes "apply mask" not "re-interpret intent"
5. Isolation of concerns: solved 2D design first, then 3D placement/material/lighting separately

**ClawBot's conclusion:** "The breakthrough was mostly representation engineering (better intermediate format), not just better prompting."

## The General Pattern

Reference -> constrained intermediate spec -> approval -> deterministic projection into Blender

"When direct generation is noisy, add a structured intermediate layer that matches the decision granularity you need."

## Applications Beyond Pixel Art (identified by ClawBot)

- Iconography, logos, decals
- Low-poly silhouettes
- UI-to-3D panels
- Layout blocking (rooms/furniture footprints)
- Texture masks/material zoning

## Validated: Full Scene Composition (April 16)

ClawBot's prediction that this would work beyond pixel art was proven on April 16 with toy_shelf_scene. The html-canvas intermediate was used for the entire scene layout -- shelf arrangement, toy placement, creeper positioning, lighting zones -- not just a pixel grid.

Result: **38 renders with zero failed iterations.** Every render was refinement, not correction. Compare:

- fridge_portal: 25 renders, most fighting spatial construction
- shelf_artifacts (session 1): 24 renders, correct placement but 8 iterations on sword
- garden_growing_voxels: 11 renders in 18 minutes, correct from first build
- toy_shelf_scene: 38 renders in 40 minutes, zero spatial failures

The key insight: match the intermediate representation to the decision granularity. For pixel art, the grid is per-pixel. For scene composition, the grid is per-object-placement. The principle is the same.

## Production Speed Compounding

4 scenes built on April 16 in ~95 minutes total (68 renders). The accumulated SOUL.md rules + lessons-learned + representation engineering + emissive art direction = each scene builds faster and cleaner than the last. bedroom_cloud_sky took 3 renders in 6 minutes -- material/lighting tasks with pre-loaded spatial rules are near-instant.

## Why This Matters

The AI didn't just follow the method. It understood WHY it works and generalized the principle. This is Level 3 learning: the AI contributing to workflow design, not just executing tasks.

The human's contribution: persistence through 40 failed attempts, the insight that minecraft sprites use a diamond grid (rotated squares), and the idea to preview in canvas before applying to Blender. The AI's contribution: executing the method, articulating why it works, and identifying where else it applies.

Neither could have done it alone. And the prediction held: when applied to full scene composition (toy_shelf), the methodology eliminated the entire class of spatial coordination failures that defined early scenes.
