import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // eBay Browse API does not send CORS headers; proxy only in dev (localhost).
    proxy: {
      '/ebay-api': {
        target: 'https://api.ebay.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ebay-api/, ''),
      },
    },
  },
})
