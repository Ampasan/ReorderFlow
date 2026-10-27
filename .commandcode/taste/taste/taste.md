# Taste
- Backend should follow Clean Architecture with separated layers (handler / service / repository / model). Confidence: 0.8
- API responses must use a standard JSON envelope: `{ "success": true, "message": "...", "data": ... }`. Confidence: 0.8
- Reads and understands all spec files in /docs before writing any code. Confidence: 0.7
- Prefers thorough, step-by-step explanations and written docs ("kasih tau yang detail dan lengkap serta mudah dipahami", "lengkap dan detail tetapi mudah dipahami") — comprehensive yet easy to follow — over terse output. Confidence: 0.7
- Works backend-only; never touches frontend/UI code (no React, HTML/CSS, or other frontend files). Confidence: 0.8
- Treats API latency as a standing quality bar, not an optional extra: expects the backend to feel near-instant ("tidak lag/load lama") and wants performance work done proactively before handing it to the frontend. Confidence: 0.65
