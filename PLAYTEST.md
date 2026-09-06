# PLAYTEST

Primary feel: the active piece lives **above the grid** and slides left/right. Column-tap is only aim (or drop once that column is already aimed). Not the old tap-any-column-to-drop.

## Controls

- **← →** keyboard, on-screen arrows, or horizontal swipe: slide the piece across columns immediately.
- **Click a column:** aim there (piece, ghost, and column wash follow).
- **Drop:** ↓ / Space / **↓ Drop** / tap the active piece / click the column that is already aimed.
- Ghost sits on the **lowest empty cell** of the aimed column (teach lock: ghost only on the teach column until the first drop).

## Teach (first 10s)

1. Nigiri is already in the teach column. Held piece above the grid is also Nigiri.
2. That column only shows **Drop here first**. Footer one-liner until first merge: `← → move · ↓ drop. Match to merge.`
3. L/R is free. Dropping in the wrong column **soft-bounces** back to the teach column **and** flashes **Drop here first** — never a silent bounce.
4. Drop on the teach column: piece **falls** from the rail onto the cell stacked on that Nigiri, then merges → Maki. Teach cue hides.

Pass: a stranger sees where to drop first, can read tile names (Nigiri/Maki/…), and does not see DANGER or eng footer clutter.

## Identity

Every tile shows its short tier name on the art (Nigiri, Maki, Gunkan, Temaki, Chirashi, Platter, Feast). Names stay visible — not art-only.

## Chrome

- DANGER line is hidden until rising rows ship.
- No player-facing “no rising rows” / GRO / vertical-merge-only note.

## Landing check (blocking)

A drop must visibly tween from the active piece **above the grid** down to the **lowest empty cell** in that column (stack on existing tiles; empty column = bottom row). Then merge if same tier.

Must not: stick mid-column, teleport, stay at the top, or end the tween above the real landing cell.
