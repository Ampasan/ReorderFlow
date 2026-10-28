# Taste
- Backend should follow Clean Architecture with separated layers (handler / service / repository / model). Confidence: 0.8
- API responses must use a standard JSON envelope: `{ "success": true, "message": "...", "data": ... }`. Confidence: 0.8
- Reads and understands all spec files in /docs before writing any code. Confidence: 0.7
- Prefers thorough, step-by-step explanations and written docs ("kasih tau yang detail dan lengkap serta mudah dipahami", "lengkap dan detail tetapi mudah dipahami") — comprehensive yet easy to follow — over terse output. Confidence: 0.7
- Works backend-only; never touches frontend/UI code (no React, HTML/CSS, or other frontend files). Confidence: 0.8
- Wants DB migrations kept minimal and separated by purpose: just two files, one for schema (`001_schema.sql`) and one for seed data (`002_seed.sql`) — no extra consolidated/all-in-one migration. Confidence: 0.7
- Treats API latency as a standing quality bar, not an optional extra: expects the backend to feel near-instant ("tidak lag/load lama") and wants performance work done proactively before handing it to the frontend. Confidence: 0.65
- Prefers stock/quantity mutations to be server-computed atomic deltas (e.g. `UPDATE ... SET x = x + $1`) inside a transaction, never absolute values sent from the client; absolute writes are reserved for deliberate human corrections (e.g. stock opname) with a recorded reason. Confidence: 0.8
- Prefers write endpoints to be idempotent and guarded against double-submission (unique constraint keys, disable the submit action while a request is pending). Confidence: 0.7
