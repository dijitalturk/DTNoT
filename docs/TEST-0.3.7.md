# DTNoT 0.3.7 verification

## Reproduced regression
With a real installed Chromium extension, edit/save followed by hiding the last visible note persisted the hide timestamp but left its card visible. Resetting the render signature to an empty string collided with the empty note-list signature. The unchanged-render shortcut now applies only to nonempty lists.

## Changes
- Remove the stale card when no visible notes remain.
- Avoid querying background storage every 2.5 seconds on empty pages; schedule hidden-note reappearance for the actual expiration time.
- Preserve unchanged note DOM on unrelated storage changes and position-only writes.
- Avoid building a full placement grid when the saved location already fits.
- Connect popup controls before waiting for background data and load independent startup data concurrently.
- Serialize background note writes so simultaneous updates cannot overwrite each other; failed operations do not block later writes.
- Initialize the SPA URL tracker to the current URL so its first tick does not discard a draft.

## Completed checks
- `node tests/dtnot-test.mjs`: 112 passed.
- `node tests/content-browser.cjs` with Playwright: viewport bounds, cancellation, draft preservation, failed save/retry, failed read, queued hide and duplicate injection passed.
- `python3 build.py`: Firefox and Chrome/Edge archives generated and verified.
- `node tests/extension-e2e.cjs` with Playwright and Chrome for Testing 143: installed the unpacked Chromium extension in a disposable profile, using real Chrome runtime messaging, service worker, storage and storage change events. Optional site access is pre-granted in the test fixture manifest only.
- Real extension checks passed: edit/save/hide, five consecutive minimize/reopen/hide cycles, editing and hiding the last note in all four layouts, timed reappearance, zero background note reads during a 2.8-second idle empty-page period, 20 parallel additions retained, write queue recovery after an invalid update, and popup controls usable while a background response is intentionally held.
- Five popup page reload/settings interactions: approximately 57–75 ms in the isolated test profile; this is not a general performance guarantee.

## Limits
The popup HTML/controller runs in the real extension context, but a headless toolbar popup target could not be inspected through Playwright. Native Firefox/Zen and Microsoft Edge were not exercised. Before store rollout, verify the toolbar icon and the same note actions in the intended installed browser. Reload existing web tabs after updating the extension so their content scripts use the new version.

## Re-run
Install Playwright, run `python3 build.py`, then `node tests/extension-e2e.cjs`. Set CHROMIUM_PATH to a Chrome for Testing executable if Playwright’s default browser is unavailable.
