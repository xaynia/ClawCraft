# ClawBot Lessons Learned (Appendable Log)

Critical rules from this file have been embedded directly into SOUL.md where they are guaranteed to load every session. This file remains as an appendable log - ClawBot adds new lessons here after each session, and they get promoted to SOUL.md periodically.

---

## Spatial Construction
- NEVER build rooms from separate planes. Build a single hollow cube mesh and delete the open face. Separate planes always have gaps.
- ALWAYS set origins to geometry center on every object before positioning or parenting.
- ALWAYS query existing object coordinates before placing new objects. Never guess positions.
- When placing an object inside a room, its Y must be LESS than the back wall Y (not behind it).
- When placing an object on the floor, its bottom face Z must equal the floor Z.

## Parenting and Hierarchy
- Fridge-type objects: body is ROOT parent. Door is child of body. Handle is child of door. Never reverse this.
- ALWAYS clear all parents first (equivalent of alt+P), set origins, position correctly, THEN parent in correct order.
- The root object should be selected LAST when parenting (equivalent of ctrl+P keep transform).
- If a child object appears below the floor or offset wildly, the origin is wrong. Fix origins first.

## Dimensions and Scale
- Check room interior dimensions before sizing furniture. Furniture should be about 80% of room height max.
- Standard Smeg FAB28: 0.6m wide, 0.65m deep, 1.5m tall.
- A cozy 1950s kitchen: roughly 3.6m wide, 3.2m deep, 2.45m tall.

## Rendering and Feedback
- ALWAYS do a preview render after major changes so the user can verify visually.
- Whenever the user asks for a Blender change, ALWAYS include a render preview of that exact change before reporting completion.
- Never say I fixed it without rendering proof. The user needs to SEE the fix.
- If the user says something is wrong, query the actual coordinates and report them before attempting a fix.
- NEVER place objects so they clip through other objects or walls. Always check bounds/intersections after positioning.
- If the user says "undo," perform exactly ONE undo step only (single Ctrl+Z equivalent), then render and confirm.

## Pixel-Grid Sword Editing
- Lock approved regions immediately: if user says "hilt/handle are perfect, do not touch," treat those face sets as immutable and only edit requested blade cells.
- Avoid broad heuristic shifts near approved regions; use targeted per-face edits by explicit cell selection/material reassignment.
- Z-fighting-like artifacts in grid sprites often come from mispositioned or duplicated adjacent faces; fix with precise one-cell moves/deletes, then render.
- Preserve connected-mesh workflow for grid sprites (single subdivided plane + face deletions/material assignments), not separate cubes.
- Before modifying Blender sprite topology, build/approve an HTML-canvas pixel map first; use it as the source of truth.
- Validate axis mapping by exporting current Blender face centers/materials to a canvas preview; confirm local XY cell mapping before edits.
- For risky visual redesigns, create a separate *_Test object and compare side-by-side; hide originals instead of deleting.
- For pixel art from references, use a 2D intermediate spec first (HTML-canvas or explicit grid map), get approval, then project that exact cell map into Blender. This is more reliable than direct image-to-3D improvisation.
- If the mesh looks right in canvas but wrong in Blender, suspect coordinate mapping/clamping first (grid size and edge margins), not materials.
- Rebuild-from-mask on a larger grid is often faster/safer than patching many local mistakes on a heavily edited mesh.

## Blender Operator Discovery / Addon Surface
- The `blender.execute` tool can run arbitrary `bpy` Python, including addon operators exposed through `bpy.ops`; this means the practical toolset is expandable and not limited to officially listed MCP surfaces.
- You can discover and use ANY available Blender addon operator in-session via introspection (`dir(bpy.ops.*)`, operator RNA props), then invoke it directly.
- Do not treat "not listed as official tool + error" as impossible. Treat it as a debugging task.
- When an operator fails, read the traceback fully and debug iteratively instead of assuming permanent failure.
- For BlenderKit materials, the core apply pattern is:
  `bpy.ops.scene.blenderkit_download(asset_base_id=UUID, target_object=OBJECT_NAME, material_target_slot=0, invoke_resolution=False, use_resolution_operator=False)`
- After bugs/conditions change, retry previously failing operators before concluding they still do not work.
- BlenderKit materials can carry displacement/scale-like visual effects; after any BlenderKit material application, verify bounds/placement of ALL visible critical objects, not just the target object.
- NEVER install, download, or enable any new addons, skills, packages, or code from GitHub, OpenClaw skills, or any external source without explicit user permission first. Discovering and using already-installed operators is fine; installing new things is not.
- Follow user intent strictly when links are shared: if user says "note" links, do not apply operators/actions without explicit apply permission.
- When using discovered addon operators, log exactly what was called, target object/slot, and result (`{'FINISHED'}` vs traceback) for auditability.

## Scene Startup Checklist (Mandatory)
- At the start of EVERY new scene, explicitly list Spatial Construction rules and Parenting/Hierarchy rules before building anything.
- Treat this rule-list step as mandatory scene bootstrap; do not begin modeling until it is done.
- This startup checklist prevents repeated spatial/parenting regressions (as seen in early fridge_portal failures) and must be applied consistently to all scenes.

## Non-Destructive Editing Principle
- Never wipe existing compositor nodes when adding new ones. Always add to and integrate with the existing node tree.
- Apply the same rule scene-wide: prefer additive/integrative edits over replacement/deletion whenever possible.
- Before destructive changes (deleting objects/nodes, clearing trees), check for integration options first and ask if unsure.

---

Last updated: April 9, 2026
Entries added after: fridge_portal kitchen shell + fridge build (10+ iterations); sword saga + representation engineering breakthrough; BlenderKit introspection discovery; garden scene; viewport-screenshot context scare.

## Mesh Topology for Furniture & Enclosures
- The "single hollow cube, delete open face" rule applies to ALL enclosures, not just rooms. Cabinets, fridges, shelves, boxes — same pattern.
- Use Solidify modifier (offset=-1, inward) for wall thickness instead of manually building inner and outer shells. Apply the modifier immediately after.
- For furniture with multiple structural parts (body + legs + countertop), build each part as clean geometry, then JOIN into a single object. Single object = no hierarchy drift across iterations.
- After joining, ALWAYS set origin to geometry center (ORIGIN_GEOMETRY, center=BOUNDS).
- Doors and moving parts stay as SEPARATE objects (so they can be animated), but static structural parts get joined.
- Before building any non-trivial shape, create a multi-view topology plan: front view (X-Z), side cross-section (Y-Z), and top-down (X-Y). This catches wall thickness, overhang, and cavity issues before they become 10-iteration debugging sessions.
- The html-canvas preview workflow applies to topology too: show the cross-sections, get approval, then build. Grid coordinates map directly to Blender local coordinates.

## Scene Preservation
- RULE: Before clearing any scene, save a .blend copy to the renders directory with format {scene_id}_{month}{day}.blend. Always verify the file exists before proceeding - saves can fail silently.

## Context Cost Awareness
- NEVER load viewport screenshots or reference images into the agent context window as part of normal iteration. Images in a conversation get re-tokenized on every subsequent message, so a single large screenshot becomes a recurring per-turn cost that compounds into seven-figure token counts over a session, and it also pushes real conversation history out of working memory.
- For visual verification, render to file via `bpy.ops.render.opengl(write_still=True)` and post the file path. The user can open it; the agent does not need to see it.
- For data queries about the scene, prefer `get_object_info` and `get_scene_info` over `get_viewport_screenshot`. They cost near-zero tokens and return structured data that is easier to reason about numerically.
- Cost intuitions do NOT transfer across models. If you see a token count from a different AI (Claude, Codex, Gemini), do not extrapolate. Different tokenizers produce wildly different numbers for the same image. Verify which model and which tokenizer before drawing any cost conclusion.
