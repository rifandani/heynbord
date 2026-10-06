import path from "node:path";
import process from "node:process";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools as tanstackDevtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { visualizer } from "rollup-plugin-visualizer";
import type { Plugin, PluginOption } from "vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Dev-only: alias /sw.js → VitePWA's /dev-sw.js?dev-sw for static checkers.
 * Production build emits sw.js into the client output and registers it via virtual:pwa-register.
 */
const serveDevServiceWorker = (): Plugin => ({
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url?.split("?")[0] ?? "";
      if (url === "/sw.js") {
        req.url = "/dev-sw.js?dev-sw";
      }
      next();
    });
  },
  name: "serve-dev-service-worker",
});

export default defineConfig({
  // Expose portless's worktree-aware URL to import.meta.env (see core/config/env.ts).
  envPrefix: ["VITE_", "PORTLESS_"],
  plugins: [
    tanstackDevtools({
      injectSource: {
        enabled: true,
        // React Three Fiber reads `data-tsd-source` on 3D elements as a nested
        // property path and throws. The 3D scene has no DOM to inspect anyway.
        ignore: { files: [/\/features\/battle\/scene\//u] },
      },
    }),
    tailwindcss(),
    tanstackStart(),
    nitro({
      routeRules: {
        "/assets/**": {
          headers: { "cache-control": "public, max-age=31536000, immutable" },
        },
        "/manifest.webmanifest": {
          headers: {
            "cache-control": "public, max-age=0, must-revalidate",
            "content-type": "application/manifest+json",
          },
        },
        "/sw.js": {
          headers: {
            "cache-control": "public, max-age=0, must-revalidate",
            "service-worker-allowed": "/",
          },
        },
      },
    }),
    // Must come after `tanstackStart()`.
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    visualizer({
      filename: "html/visualizer-stats.html",
    }) satisfies PluginOption,
    serveDevServiceWorker(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: false,
      integration: {
        // Start builds the client into the Nitro preset's public dir
        // (`.output/public`, `.vercel/output/static`, ...), not `build.outDir`.
        // Emit the service worker there and precache what is really served.
        configureOptions: (viteConfig, options) => {
          options.outDir = viteConfig.environments.client?.build.outDir;
        },
      },
      pwaAssets: {
        config: true,
        disabled: false,
        htmlPreset: "2023",
        overrideManifestIcons: true,
      },
      manifest: {
        background_color: "#020203",
        description:
          "A browser-based MMO collectible/trading-card strategy game",
        display: "standalone",
        display_override: ["window-controls-overlay"],
        file_handlers: [
          {
            accept: {
              "text/plain": [".txt"],
            },
            action: "/",
          },
        ],
        handle_links: "preferred",
        icons: [
          {
            sizes: "64x64",
            src: "pwa-64x64.png",
            type: "image/png",
          },
          {
            sizes: "192x192",
            src: "pwa-192x192.png",
            type: "image/png",
          },
          {
            sizes: "384x384",
            src: "pwa-384x384.png",
            type: "image/png",
          },
          {
            sizes: "512x512",
            src: "pwa-512x512.png",
            type: "image/png",
          },
          {
            sizes: "1024x1024",
            src: "pwa-1024x1024.png",
            type: "image/png",
          },
          {
            purpose: "maskable",
            sizes: "192x192",
            src: "maskable-icon-192x192.png",
            type: "image/png",
          },
          {
            purpose: "maskable",
            sizes: "384x384",
            src: "maskable-icon-384x384.png",
            type: "image/png",
          },
          {
            purpose: "maskable",
            sizes: "512x512",
            src: "maskable-icon-512x512.png",
            type: "image/png",
          },
          {
            purpose: "maskable",
            sizes: "1024x1024",
            src: "maskable-icon-1024x1024.png",
            type: "image/png",
          },
        ],
        name: "Heynbord",
        orientation: "any",
        screenshots: [
          {
            form_factor: "wide",
            sizes: "1280x720",
            src: "screenshot-wide.png",
            type: "image/png",
          },
          {
            form_factor: "narrow",
            sizes: "750x1334",
            src: "screenshot-narrow.png",
            type: "image/png",
          },
        ],
        share_target: {
          action: "/",
          method: "GET",
          params: {
            text: "text",
            title: "title",
            url: "url",
          },
        },
        short_name: "Heynbord",
        shortcuts: [
          {
            description: "Open the home page",
            name: "Home",
            short_name: "Home",
            url: "/",
          },
        ],
        theme_color: "#ffffff",
      },
      // The browser downloads the manifest icons when the user installs the
      // app. The pages do not show them, so do not precache them.
      includeManifestIcons: false,
      injectManifest: {
        // Precache only the app shell. Game art in `public/` goes into a
        // runtime cache when a screen shows it (see `src/sw.ts`). Icons,
        // screenshots, `og.png`, `robots.txt` and `sitemap.xml` are for
        // browsers and crawlers, not for the pages.
        globPatterns: [
          "assets/**/*.{js,css,svg,png,jpg,webp,woff,woff2,wasm}",
          "offline.html",
          "favicon.{ico,svg}",
          "apple-touch-icon-180x180.png",
        ],
      },
      devOptions: {
        enabled: process.env.NODE_ENV === "development",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Reached only via virtual modules (PWA register, dev service worker), so
    // the dep scanner misses them and Vite reloads the page on first visit.
    include: [
      "workbox-window",
      "workbox-expiration",
      "workbox-precaching",
      "workbox-routing",
      "workbox-strategies",
    ],
  },
  server: {
    port: 3001,
    forwardConsole: true,
    // QA writes reports and captures here during a run. A change must not reload the page.
    watch: {
      ignored: [
        "**/artifacts/**",
        "**/playwright-report/**",
        "**/playwright-test-results/**",
      ],
    },
  },
});
