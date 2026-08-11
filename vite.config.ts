import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
svgr(),
    VitePWA({
      registerType: "autoUpdate",
  workbox: {
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024

  },
      manifest: {
        name: "Learnova",
        short_name: "Learnova",
        description: "Learning Management System",

        start_url: "/",

        display: "standalone",

        theme_color: "#1976d2",

        background_color: "#ffffff",

        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
});