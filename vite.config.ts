import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get base path from environment variable or use default
// For GitHub Pages, set GITHUB_REPOSITORY_NAME to your repo name
// Example: GITHUB_REPOSITORY_NAME=demo-termopane
const repoName = process.env.GITHUB_REPOSITORY_NAME || 'demo-termopane';
const base = process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/';

// Log for debugging (only in build, not in dev)
if (process.env.GITHUB_PAGES === 'true') {
  console.log(`Building with base path: ${base}`);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
