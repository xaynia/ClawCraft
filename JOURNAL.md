# ClawCraft Iteration Log

Raw process documentation: every render the pipeline produced, ordered by scene and iteration. The progression tells the story from first attempt to final polish. Failures, fixes, and breakthroughs.

## At a Glance (as of April 6, 2026)

- ~209 renders across 5 scenes and 6 sessions. Presentation April 9.
- Pipeline was broken for a week due to a silent tool name conflict. Fixed March 31. Fully operational since.
- fridge_portal: 23 renders, mostly fighting spatial construction. The AI couldn't build a room from separate walls or place a fridge inside it.
- shelf_artifacts: 169 renders across 3 sessions. Evolved from basic shelf to polished scene with Minecraft diamond sword, emissive materials, BlenderKit PBR textures, and compositor post-processing.
- garden_growing_voxels: 10 renders in ~18 minutes. Built using the "representation engineering" workflow discovered during the sword saga. First scene where the planning-first approach was used from the start.
- The AI excels at materials, lighting, and parameter-based operations (1-2 iterations). It struggles with spatial coordination and multi-part assembly (8-25 iterations). But with the right intermediate representation (html-canvas 2D preview), spatial tasks drop to 1-2 iterations too.
- Writing failure corrections into the AI's instruction file (SOUL.md) produced measurable improvement across scenes (Reflexion-style learning).
- The AI discovered it could extend its own toolset by introspecting Blender's operator registry (BlenderKit via bpy.ops). It also self-analyzed its methodology and named it "representation engineering."
- Each scene builds faster than the last: fridge 25 renders fighting walls, shelf 24 first session + 145 iterating, garden 10 renders total in 18 minutes.

**Thesis:** AI-assisted 3D art creation produces two complementary forms of intelligence that neither human nor AI achieves alone: the human provides spatial reasoning and persistence the AI lacks, while the AI provides pattern analysis, methodology articulation, and emergent tool discovery the human can't efficiently perform. The iterative feedback loop isn't a workaround for AI limitations -- it's the creative method itself. And when the right intermediate representation is found (html-canvas as a planning layer), the loop accelerates dramatically.

---

## Project Stats

- **Total renders:** ~209
- **Total render time:** EEVEE renders in 1-3 seconds each. The time is in the iteration loop, not the rendering.
- **Scenes attempted:** 5 (test_cube, test_sphere, fridge_portal, shelf_artifacts, garden_growing_voxels)
- **Sessions:** 6 (March 23 infrastructure, March 26 Notion, March 28 failed renders, March 31 breakthrough, April 2-3 sword saga + breakthroughs, April 4 garden + housekeeping)

### Per-Scene Breakdown

**fridge_portal** - 23 renders across 3 sessions
- March 26: 2 renders (early test)
- March 28: 11 renders (broken pipeline, images never posted to Discord)
- March 31: 10 renders (working pipeline, spatial reasoning battleground)
- Issues: walls as separate planes with gaps, fridge behind back wall, parts floating, parenting reversed, origins off-center
- Fix that worked: "build a hollow cube and delete the front face" instead of "build a room with connected walls"

**shelf_artifacts** - 169 renders across 3 sessions
- March 31: 24 renders in ~96 min. First build correct (SOUL.md lessons from fridge). Polished to wood shelf, iron brackets, mugs, potion, gem, wall-mounted sword.
- April 2-3: ~120 renders. Minecraft diamond sword saga (40+ failed direct attempts, then html-canvas breakthrough). Emissive materials. BlenderKit discovery.
- April 3-4: ~25 renders. BlenderKit PBR materials, compositor nodes (glare, fog glow, star glints), continued polish.

**garden_growing_voxels** - 10 renders in one session
- April 4: 10 renders in ~18 minutes (2:21 AM to 2:39 AM)
- First scene built using the full "representation engineering" workflow from the start
- html-canvas preview approved before any Blender work. Built correctly on essentially the first attempt.

**test_cube** - 3 renders. Pipeline validation.

**test_sphere** - 3 renders. First successful iterative feedback loop.

### What ClawBot's Own Analysis Found

From ClawBot's workflow_observation field across ~209 renders:
1. Constraint-driven edits converge faster than subjective nudging
2. Geometry-first, then materials/lighting improves iteration clarity
3. Measured coordinate snapping beats visual guessing for contact/seating
4. Single-mesh workflows reduce drift in iterative prop work
5. Frequent milestone previews catch structural errors early
6. Small orientation/framing tweaks produce large readability gains
7. Material micro-detail (roughness, texture variation) significantly increases perceived realism without changing composition
8. **When direct generation is noisy, add a structured intermediate layer that matches the decision granularity you need** (ClawBot's own articulation of the html-canvas methodology)
9. AI self-limits based on tool surface assumptions even when it has execute access to the entire host application
10. Errors should be debugged, not accepted as permanent limitations

### Three Levels of Learning

**Level 1 - Human-taught rules (SOUL.md):** Human corrects AI spatial failures and writes explicit rules. Example: "build rooms as hollow cube, not separate planes." These rules transferred from fridge_portal to shelf_artifacts, reducing iterations from 25 to correct-on-first-build.

**Level 2 - AI self-observed patterns (workflow_observation):** ClawBot analyzes his own process after each render. Example: "constraint-driven edits converge faster than subjective nudging." The AI recognizes its own limitations and recommends mitigations.

**Level 3 - AI methodology articulation:** ClawBot named the html-canvas workflow "representation engineering" and independently identified where else it applies (logos, room layouts, texture masks). The AI contributed to workflow design, not just task execution.

Neither level works alone. The human can't generate 209 renders and analyze patterns efficiently. The AI can't reason about 3D space or debug third-party addon bugs. Three systems collaborated: ClawBot discovered methods (bpy.ops introspection), the user provided persistence and skepticism, Claude Code fixed underlying code (BlenderKit avatar512 bug).

---

## Test Renders (March 31)

First successful renders through the full Discord pipeline after fixing the canvas tool name conflict that had blocked the entire system for a week.

### test_cube - Pipeline Validation
| | |
|---|---|
| ![test_cube_002](renders/test_cube_002.png) | ![test_cube_003](renders/test_cube_003.png) |
| First render through full pipeline | Confirmed working |

### test_sphere - First Feedback Loop
| Iteration 1 | Iteration 2 | Iteration 3 |
|---|---|---|
| ![001](renders/test_sphere_001.png) | ![002](renders/test_sphere_002.png) | ![003](renders/test_sphere_003.png) |
| Initial render | Top half cut off, camera too close | Reframed after feedback, first successful iterative fix |

---

## Scene 1: fridge_portal (March 26-31)

**Vision:** A 1950s kitchen with a fridge that opens onto a blocky voxel landscape. Kitchen lighting spills through the door into the game world.

25 renders across 3 sessions. This scene was the spatial reasoning battleground where every major AI limitation was discovered and documented.

**What went wrong:** Walls built as separate planes with gaps (3 correction rounds). Fridge placed behind the back wall, outside the room. Parts floating apart. Parenting reversed (handle as root instead of body). Origins off-center causing child objects to appear below the floor. Each time ClawBot said "I fixed it" but the spatial logic was still wrong.

**What we learned:** The LLM cannot coordinate multiple objects in 3D space. It needs explicit mesh topology instructions ("build a hollow cube and delete the front face") not spatial descriptions ("build a room with connected walls"). The lower the abstraction level of the instruction (vertices > objects > descriptions), the more accurate the result.

### March 26 - Early test (renders 003-004)

| | |
|---|---|
| ![003](renders/fridge_portal_003.png) | ![004](renders/fridge_portal_004.png) |

### March 28 - Broken pipeline (renders 005-015)
These renders happened before the canvas tool conflict was discovered. The bot was generating scenes but images never posted to Discord. Retrieved from the shared volume after the fix.

| | | |
|---|---|---|
| ![005](renders/fridge_portal_005.png) | ![006](renders/fridge_portal_006.png) | ![007](renders/fridge_portal_007.png) |
| ![008](renders/fridge_portal_008.png) | ![009](renders/fridge_portal_009.png) | ![010](renders/fridge_portal_010.png) |
| ![011](renders/fridge_portal_011.png) | ![012](renders/fridge_portal_012.png) | ![013](renders/fridge_portal_013.png) |
| ![014](renders/fridge_portal_014.png) | ![015](renders/fridge_portal_015.png) | |

### March 31 - Pipeline fixed (renders 016-025)
First real art session. Kitchen shell, fridge placement, iterating on spatial construction. Every render is a documented correction of a spatial reasoning failure.

| | | |
|---|---|---|
| ![016](renders/fridge_portal_016.png) | ![017](renders/fridge_portal_017.png) | ![018](renders/fridge_portal_018.png) |
| Kitchen shell rebuilt as hollow cube | Fridge placement attempts | Still behind wall |
| ![019](renders/fridge_portal_019.png) | ![020](renders/fridge_portal_020.png) | ![021](renders/fridge_portal_021.png) |
| Origin/parenting fixes | Scale corrections | Getting closer |
| ![022](renders/fridge_portal_022.png) | ![023](renders/fridge_portal_023.png) | ![024](renders/fridge_portal_024.png) |
| Fridge inside room finally | Proportions adjusted | Near final |
| ![025](renders/fridge_portal_025.png) | | |
| Last iteration this session | | |

---

## Scene 2: shelf_artifacts (March 31)

**Vision:** A kitchen wall shelf where ordinary objects sit alongside low-poly game artifacts. Photorealistic mugs and plates next to a flat-shaded potion bottle, a blocky sword, and a crystal gem. The lighting treats them all equally, as if game items belong there.

24 renders in ~96 minutes. This scene validated the Reflexion-style learning: rules from the fridge failures were embedded in the AI's instructions (SOUL.md), and the shelf objects were placed correctly on the first build.

**What went right:** Objects placed on shelf correctly from first attempt. ClawBot did unprompted rule checks. Materials and lighting polish was fast (3-4 iterations from flat colors to glazed ceramic and glass). Wall-mounted sword display was a creative pivot that solved persistent placement issues. Glass potion bottle and crystal gem looked great on first material pass.

**What went wrong:** Sword assembly took 8 iterations. Couldn't infer blade/guard/pommel arrangement from description. Moving the shelf displaced objects on it (no spatial dependency awareness). Rules followed literally not conceptually (hollow cube rule for rooms didn't generalize to shelves).

**Key comparison:** fridge_portal took 25 renders with most iterations fighting basic spatial construction. shelf_artifacts got correct placement on first build and spent iterations on aesthetics instead. Same AI, dramatically different outcome, because of accumulated lessons.

| | | |
|---|---|---|
| ![001](renders/shelf_artifacts_001.png) | ![002](renders/shelf_artifacts_002.png) | ![003](renders/shelf_artifacts_003.png) |
| First build, white on white | Colors added | Camera pulled back, full shelf visible |
| ![004](renders/shelf_artifacts_004.png) | ![005](renders/shelf_artifacts_005.png) | ![006](renders/shelf_artifacts_006.png) |
| Sword parenting fixes | Sword orientation fixes | Sword repositioned |
| ![007](renders/shelf_artifacts_007.png) | ![008](renders/shelf_artifacts_008.png) | ![009](renders/shelf_artifacts_009.png) |
| Sword rebuilt as single mesh | Vertex snapping, first connected sword | Guard widened, gold coloring |
| ![010](renders/shelf_artifacts_010.png) | ![011](renders/shelf_artifacts_011.png) | ![012](renders/shelf_artifacts_012.png) |
| Handle lengthened, blade tapered | Shelf/bracket spacing fixed | Objects repositioned on shelf |
| ![013](renders/shelf_artifacts_013.png) | ![014](renders/shelf_artifacts_014.png) | ![015](renders/shelf_artifacts_015.png) |
| Sword tilted for visibility | Solidify + bevel modifiers | Leaning against wall attempt |
| ![016](renders/shelf_artifacts_016.png) | ![017](renders/shelf_artifacts_017.png) | ![018](renders/shelf_artifacts_018.png) |
| Wall-mounted sword display | Blade rotated to face camera | Subdivision surface experiments |
| ![019](renders/shelf_artifacts_019.png) | ![020](renders/shelf_artifacts_020.png) | ![021](renders/shelf_artifacts_021.png) |
| Glass potion bottle + crystal gem | Smooth shading pass (no subdivision) | Glossy ceramic plates |
| ![022](renders/shelf_artifacts_022.png) | ![023](renders/shelf_artifacts_023.png) | ![024](renders/shelf_artifacts_024.png) |
| Wood texture on shelf | Iron brackets, wall texture | **Final render (session 1)** |

---

## Scene 2 continued: shelf_artifacts (April 2-4)

**What happened:** The March 31 "final render" was the starting point for the most productive and discovery-rich phase of the project. Over April 2-4, the scene evolved through 145 more renders across three major phases: the Minecraft diamond sword saga, emissive material development, and BlenderKit/compositor refinement.

### Phase 1: The Sword Saga (renders 026-115, April 2-3)

The original wall-mounted sword from March 31 was a simple geometric shape. The goal was to replace it with a Minecraft-style diamond sword -- blocky, pixelated, recognizable. This took 40+ direct attempts in Blender and became the project's most important failure-to-breakthrough story.

**What went wrong:** ClawBot couldn't translate a reference image of a Minecraft diamond sword into correct Blender geometry. The sword kept coming out wrong -- wrong proportions, wrong orientation, blocks misaligned, stairs-pattern instead of diamond grid. Each iteration fixed one thing and broke another. The AI was fighting the same spatial coordination problem as fridge_portal, but at pixel scale.

**The breakthrough:** Using the html-canvas tool to generate a 2D pixel grid preview of the sword BEFORE building in Blender. The preview used a coordinate system that mapped directly to Blender's local XY space. Once the 2D layout was approved, the Blender build was deterministic -- "apply mask" instead of "re-interpret intent." The sword built correctly on the first attempt after the preview was approved.

**ClawBot named this "representation engineering":** "The breakthrough was mostly representation engineering (better intermediate format), not just better prompting." He identified the general pattern: Reference → constrained intermediate spec → approval → deterministic projection into Blender. And he generalized it beyond pixel art to logos, room layouts, texture masks, and UI panels.

| | | |
|---|---|---|
| ![030](renders/shelf_artifacts_030.png) | ![040](renders/shelf_artifacts_040.png) | ![059](renders/shelf_artifacts_059.png) |
| Early sword attempts -- wrong shape, stairs pattern | Still fighting spatial assembly | Sword starting to take shape but wrong proportions |
| ![080](renders/shelf_artifacts_080.png) | ![100](renders/shelf_artifacts_100.png) | ![110](renders/shelf_artifacts_110.png) |
| More iterations, closer but still off | Diamond grid emerging after html-canvas insight | Post-canvas: sword shape correct |
| ![115](renders/shelf_artifacts_115.png) | ![120](renders/shelf_artifacts_120.png) | ![130](renders/shelf_artifacts_130.png) |
| Sword refined, filled blade accents | Polished diamond sword, correct proportions | Sword with emissive glow beginning |

### Phase 2: Emissive Art Direction (renders ~115-144, April 3)

With the sword solved, the art direction shifted to emissive materials. The creative rule: every game object GLOWS with emission shaders. The glow signals "this doesn't belong here" -- like a screen leaking into reality. This became the unifying visual language across all scenes.

- Emission shaders added to sword (cyan glow), gem (purple), potion bottle
- Lights reduced from 28 to 12 (emissive was washing everything out)
- PBR materials on real objects (mugs, plates, shelf) contrasting with flat emissive game objects

| | |
|---|---|
| ![140](renders/shelf_artifacts_140.png) | ![144](renders/shelf_artifacts_144.png) |
| Emissive sword + dark wall + organic vines | Pre-BlenderKit material state |

### Phase 3: BlenderKit + Compositor (renders 145-170, April 3-4)

**BlenderKit discovery:** ClawBot autonomously discovered `bpy.ops.scene.blenderkit_download()` by introspecting Blender's operator registry -- a tool NOT in his official MCP toolset. He found it by running `dir(bpy.ops.scene)`. Initially it failed due to an `avatar512` bug in BlenderKit's UserProfile class. Claude Code fixed it with a one-line change to `datas.py`. After the fix, ClawBot could apply any BlenderKit PBR material by UUID.

**Why this matters:** The AI extended its own capabilities at runtime by exploring the host application's API. It wasn't programmed to use BlenderKit. It discovered it could, hit a bug, accepted the bug as permanent ("addon is broken"), and only succeeded when the human pushed back ("why did it work twice but not again?") and Claude Code debugged the actual error. Three systems, one bug, none could have solved it alone.

**Compositor nodes:** ClawBot learned the Blender 5 compositor API (`scene.compositing_node_group` instead of the deprecated `use_nodes`). Built a post-processing chain: Render Layers → Simple Star Glare → Fog Glow Glare → Mix node. Star glints + soft bloom stacked for emissive glow enhancement.

| | | |
|---|---|---|
| ![145](renders/shelf_artifacts_145.png) | ![150](renders/shelf_artifacts_150.png) | ![157](renders/shelf_artifacts_157.png) |
| BlenderKit PBR materials applied | Emissive glow with compositor bloom | Compositor refinement |
| ![160](renders/shelf_artifacts_160.png) | ![170](renders/shelf_artifacts_170.png) | |
| Continued compositor polish | **Latest render** | |

### Key findings from shelf_artifacts April sessions

1. **html-canvas as 2D planning layer** -- 40 failed direct attempts → first try with preview. The most significant workflow discovery.
2. **AI emergent tool discovery** -- ClawBot found BlenderKit via bpy.ops introspection without being told about it.
3. **AI self-limits based on perceived tool surface** -- thought BlenderKit was unavailable because it wasn't in the MCP tool list.
4. **AI accepts errors as permanent** rather than debugging them -- had the readable traceback but stopped at "addon is broken."
5. **BlenderKit materials have geometry side effects** -- displacement/scale changes from material application require bounds checking on ALL objects, not just the target.
6. **Three-system collaboration** -- ClawBot discovered the method, user provided persistence and skepticism, Claude Code fixed the underlying bug.
7. **Workflow compounding** -- each phase built on the previous one. Sword lessons → emissive art direction → BlenderKit materials → compositor post-processing.

---

## Scene 3: garden_growing_voxels (April 4)

**Vision:** A real windowsill planter box with voxel plants growing from the soil. Blocky leaves, cube stems, pixelated flowers glowing with emission shaders. Real PBR planter and soil contrasting with emissive game-world vegetation.

10 renders in ~18 minutes. The first scene built entirely using the representation engineering workflow from the start.

**What happened:** Before touching Blender, ClawBot listed all spatial construction rules, generated an html-canvas layout preview, iterated on it 3 times (flower placement, petal structure, plant spacing), got user approval, then mapped the canvas grid coordinates to Blender XYZ using the planter as anchor space with voxel grid snapping. The scene built correctly without the spatial fighting that defined earlier scenes.

**Key comparison:**
- fridge_portal: 25 renders, most iterations fighting basic room construction
- shelf_artifacts (first session): 24 renders, correct placement but 8 iterations on sword assembly
- garden_growing_voxels: 10 renders in 18 minutes, essentially correct from first build

The workflow is compounding. Rules + methodology + planning layer = dramatically faster scene production.

| | | |
|---|---|---|
| ![002](renders/garden_growing_voxels_002.png) | ![003](renders/garden_growing_voxels_003.png) | ![004](renders/garden_growing_voxels_004.png) |
| First Blender render (planter geometry) | Plants taking shape | Voxel stems and leaves |
| ![005](renders/garden_growing_voxels_005.png) | ![006](renders/garden_growing_voxels_006.png) | ![007](renders/garden_growing_voxels_007.png) |
| Refinement | Layout adjustments | Materials developing |
| ![008](renders/garden_growing_voxels_008.png) | ![009](renders/garden_growing_voxels_009.png) | ![010](renders/garden_growing_voxels_010.png) |
| Near final | Polish pass | Composition refinement |
| ![011](renders/garden_growing_voxels_011.png) | | |
| **Latest render** | | |

---

## Breakthroughs Timeline

| Date | Discovery | Impact |
|---|---|---|
| Mar 31 | canvas → html-canvas rename fixes pipeline | Entire system unblocked |
| Mar 31 | Hollow cube mesh > separate planes | Spatial construction solved |
| Mar 31 | SOUL.md lessons transfer across scenes | Reflexion-style learning validated |
| Apr 2 | html-canvas as 2D planning layer | 40 failures → 1st try success |
| Apr 3 | ClawBot names "representation engineering" | AI contributes to workflow design |
| Apr 3 | BlenderKit via bpy.ops introspection | AI extends own toolset at runtime |
| Apr 3 | Three-system collaboration model | Human + AI agent + AI assistant |
| Apr 4 | Garden scene in 18 min using full workflow | Compounding validated |
