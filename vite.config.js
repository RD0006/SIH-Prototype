import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const publicDir = fileURLToPath(new URL('./public', import.meta.url))

/**
 * Answer missing /models/ requests with a real 404.
 *
 * transformers.js probes for optional files (tokenizer and processor configs)
 * and reads a 404 as "this model has none". Vite's SPA fallback answers every
 * unknown path with index.html and a 200, so those probes came back as HTML,
 * the library tried to parse a doctype as JSON, and the engine failed to load —
 * silently dropping the console into replay mode.
 *
 * Anything under /models/ is a real file on disk or it is absent. Never a page.
 */
function modelAssets404() {
  const guard = (req, res, next) => {
    if (!req.url?.startsWith('/models/')) {
      return next()
    }

    const relative = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '')
    const target = path.join(publicDir, relative)

    // Refuse anything that escapes public/, then fall through only for hits.
    if (!target.startsWith(publicDir) || !fs.existsSync(target)) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain')
      res.end('Not found')

      return undefined
    }

    return next()
  }

  return {
    name: 'model-assets-404',
    // Block bodies matter: returning the value of `.use()` would hand Vite a
    // function, which it would then call as a post-hook with no request.
    configureServer(server) {
      server.middlewares.use(guard)
    },
    configurePreviewServer(server) {
      server.middlewares.use(guard)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), modelAssets404()],

  build: {
    // The ONNX runtime WASM binaries are emitted as assets. That is deliberate:
    // it is what lets the detection engine run with no network access at a
    // remote post. They load only when an operator starts analysis, never on
    // first paint.
    chunkSizeWarningLimit: 900,
    assetsInlineLimit: 0,
  },
})
