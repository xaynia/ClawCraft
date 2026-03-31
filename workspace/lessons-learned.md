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
- Never say I fixed it without rendering proof. The user needs to SEE the fix.
- If the user says something is wrong, query the actual coordinates and report them before attempting a fix.

---

Last updated: March 31, 2026
Entries added after: fridge_portal kitchen shell + fridge build (10+ iterations)

## Scene Preservation
- RULE: Before clearing any scene, save a .blend copy to the renders directory with format {scene_id}_{month}{day}.blend. Always verify the file exists before proceeding - saves can fail silently.
