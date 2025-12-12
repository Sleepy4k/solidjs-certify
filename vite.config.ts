import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "", // change this based on your root url path
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    host: true,
    port: 3000,
  },
  build: {
    target: "esnext",
  },
  resolve: {
    alias: {
      "@icons": resolve(__dirname, "./src/icons"),
    },
  },
});
