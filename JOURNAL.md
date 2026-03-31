# ClawCraft Iteration Log

Raw process documentation: every render the pipeline produced, ordered by scene and iteration. The progression tells the story from first attempt to final polish. Failures, fixes, and breakthroughs.

## At a Glance (as of March 31, 2026)

- 59 renders so far across 4 scenes and 4 sessions. Art production ongoing.
- Pipeline was broken for a week due to a silent tool name conflict. Fixed March 31.
- fridge_portal: 25 renders, mostly fighting spatial construction. The AI couldn't build a room from separate walls or place a fridge inside it.
- shelf_artifacts: 24 renders, polished to completion. Lessons from fridge embedded in AI instructions. Objects placed correctly on first build.
- The AI excels at materials, lighting, and parameter-based operations (1-2 iterations). It struggles with spatial coordination and multi-part assembly (8-25 iterations).
- Writing failure corrections into the AI's instruction file (SOUL.md) produced measurable improvement across scenes.
- The AI analyzed its own process and independently identified that constraint-driven edits outperform subjective descriptions.
- More scenes coming. This log will grow as the project continues.

**Thesis:** AI-assisted 3D art creation produces two complementary forms of intelligence that neither human nor AI achieves alone: the human provides spatial reasoning the AI lacks, while the AI provides pattern analysis across iterations the human can't efficiently perform. The iterative feedback loop isn't a workaround for AI limitations. It's the creative method itself.

---

## Project Stats

- **Total renders:** 59
- **Total render time:** 2 minutes 7 seconds (EEVEE is fast. The time is in the iteration loop, not the rendering.)
- **Scenes attempted:** 4 (test_cube, test_sphere, fridge_portal, shelf_artifacts)
- **Sessions:** 4 (March 23 infrastructure, March 26 Notion, March 28 failed renders, March 31 breakthrough)

### Per-Scene Breakdown

**fridge_portal** - 25 renders across 3 sessions
- March 26: 2 renders (early test)
- March 28: 13 renders (broken pipeline, images never posted to Discord)
- March 31: 10 renders (working pipeline, spatial reasoning battleground)
- Issues: walls as separate planes with gaps, fridge behind back wall, parts floating, parenting reversed, origins off-center
- Fix that worked: "build a hollow cube and delete the front face" instead of "build a room with connected walls"

**shelf_artifacts** - 24 renders in one session
- March 31: 24 renders in ~96 minutes (3:36 PM to 5:12 PM)
- Objects placed correctly on first build (SOUL.md lessons from fridge worked)
- 8 iterations on sword assembly alone (spatial coordination failure on multi-part object)
- 3-4 iterations on materials/lighting (AI's strength: parameter-based operations)
- Final render: wood shelf, iron brackets, glazed ceramic mugs, glass potion bottle, crystal gem, wall-mounted sword

**test_cube** - 3 renders
- Pipeline validation after fixing the canvas tool name conflict

**test_sphere** - 3 renders
- First successful iterative feedback loop (reframe after camera was too close)

### What ClawBot's Own Analysis Found

From ClawBot's workflow_observation field across 59 renders:
1. Constraint-driven edits converge faster than subjective nudging
2. Geometry-first, then materials/lighting improves iteration clarity
3. Measured coordinate snapping beats visual guessing for contact/seating
4. Single-mesh workflows reduce drift in iterative prop work
5. Frequent milestone previews catch structural errors early
6. Small orientation/framing tweaks produce large readability gains
7. Material micro-detail (roughness, texture variation) significantly increases perceived realism without changing composition

### Two Levels of Learning

**Level 1 - Human-taught rules (SOUL.md):** Human corrects AI spatial failures and writes explicit rules. Example: "build rooms as hollow cube, not separate planes." These rules transferred from fridge_portal to shelf_artifacts, reducing iterations from 25 to correct-on-first-build.

**Level 2 - AI self-observed patterns (workflow_observation):** ClawBot analyzes his own process after each render. Example: "constraint-driven edits converge faster than subjective nudging." The AI recognizes its own limitations and recommends mitigations.

Neither level works alone. The human can't generate 59 renders and analyze patterns efficiently. The AI can't reason about 3D space. Each provides what the other lacks.

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
| Wood texture on shelf | Iron brackets, wall texture | **Final render** |
