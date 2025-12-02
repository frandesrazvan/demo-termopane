import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get base path from environment variable for GitHub Pages
// In GitHub Actions, GITHUB_PAGES will be 'true' and GITHUB_REPOSITORY_NAME will be set
const repoName = process.env.GITHUB_REPOSITORY_NAME || 'demo-termopane';
const base = process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/';

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