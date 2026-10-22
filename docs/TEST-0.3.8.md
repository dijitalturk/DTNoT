# DTNoT 0.3.8 — stable post-it positions

## Reproduction
In a real installed Chromium extension, drag the first post-it, add two more, and delete the first two through their menus. The automatically placed surviving card moved from (608, 227) to (290, 622) when another card was deleted. Every redraw previously recomputed placement from storage; automatically assigned positions existed only in the old DOM.

## Scoped fix
Before rebuilding notes, capture the positions and minimized state of the current page’s visible post-its. Reserve unchanged cards at their visible positions before placing new or resized cards. Page identity prevents reusing coordinates from another URL. Viewport clamping and collision checks with banners/footers remain in place. Existing persisted drag coordinates remain the fallback on page load.

## Verification
- Real extension tests pass for an automatically positioned survivor, a dragged first survivor and a dragged last survivor: add neighbours, delete each neighbour, verify the survivor moves no more than one pixel.
- Dragged first/last survivor positions also survive page reload.
- The existing real Chrome extension suite passes: minimize/reopen/hide cycles, four-layout editing/saving/hiding, timed reappearance, idle query reduction, concurrent writes, and popup controls during delayed data loading.
- The existing DOM browser suite and all 112 dependency-free tests pass.
- Firefox and Chrome/Edge packages generated and validated by build.py.

Native Firefox/Zen and Edge were not run. Toolbar popup inspection remains outside the headless test coverage; see TEST-0.3.7.md for test environment details.
