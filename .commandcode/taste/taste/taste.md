# Taste
- Communicates in Indonesian; expects answers written in Indonesian. Confidence: 0.75
- Wants code split into modules by responsibility, but modularity must stay easy to understand, read, and maintain — not abstraction for its own sake. Confidence: 0.65
- Landing navbar should only link to sections that actually exist on the landing page (in content order); don't add cross-page links like Artikel/FAQ there — those belong in a separate footer group. Confidence: 0.65
- Expects route navigation (Artikel/FAQ/Beranda links) to start from the top of the new page — scroll position should reset on navigation, not carry over. Confidence: 0.55
- Prefers static assets (e.g., logos) to come from remote links (Cloudinary) rather than local bundled/embedded files; when a file is deleted in the working tree, treat it as intentional and remove the now-dead embed/bundling code instead of restoring it from git. Confidence: 0.55
- Cross-page section links (e.g., footer "Jelajahi" pointing to /#section) should land directly on the target section via hash scroll, not just reset to page top; plain page navigation still starts at top. Confidence: 0.6
- Wants the newest and fastest model/version in use rather than a pinned older one ("yang paling cepat dan modern"). Confidence: 0.5
- Wants commit messages written in English (Conventional Commits style) and framed around the feature being added — `feat(...)` when the change introduces functionality, not just the fix wording. Confidence: 0.6
- Wants bug fixes taken to the actual root cause and verified working end-to-end, not a plausible patch: "buat perbaikan pokoknya sampai berhasil". Confidence: 0.55
