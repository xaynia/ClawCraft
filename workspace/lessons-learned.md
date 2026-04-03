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

---

Last updated: March 31, 2026
Entries added after: fridge_portal kitchen shell + fridge build (10+ iterations)

## Scene Preservation
- RULE: Before clearing any scene, save a .blend copy to the renders directory with format {scene_id}_{month}{day}.blend. Always verify the file exists before proceeding - saves can fail silently.
