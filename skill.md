---

## 9. Advanced Media Handling (Video, Audio & Masks)

When the workflow involves multi-frame or audio nodes:

1. **Video/Animation Outputs** (`VHS_VideoCombine`, `SaveAnimatedWEBP`):
   - Listen for `executed` payloads containing `gifs` or `videos` arrays instead of `images`.
   - Render using standard `<video controls loop playsInline>` elements rather than `<img>`.
   - Set the `view` endpoint with proper MIME handling:
     ```typescript
     const videoUrl = `${serverUrl}/view?filename=${encodeURIComponent(item.filename)}&subfolder=${encodeURIComponent(item.subfolder || "")}&type=${item.type || "output"}&format=video/mp4`;
     ```

2. **Inpainting & Mask Uploads**:
   - For inpaint workflows, implement a 2D canvas overlay layer enabling users to draw black/white alpha masks.
   - Upload both original image and mask blob via `POST /upload/image`, linking paths to `LoadImage` and `LoadImageMask` nodes respectively.

---

## 10. Production Deployment & Reverse Proxy Strategy

Avoid exposing ComfyUI directly without security layers:

1. **Next.js Route Handlers / Vite Proxy**:
   - Route traffic through `/api/comfy/*` to avoid mixed-content issues and browser CORS restrictions.
   - Example Vite proxy configuration:
     ```typescript
     // vite.config.ts
     server: {
       proxy: {
         '/api/comfy': {
           target: '[http://127.0.0.1:8188](http://127.0.0.1:8188)',
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api\/comfy/, ''),
           ws: true,
         }
       }
     }
     ```
2. **Resource Throttling**:
   - Disable UI submission buttons during active execution (`status === "running"`).
   - Provide an explicit "Interrupt" action triggering `POST /interrupt`.