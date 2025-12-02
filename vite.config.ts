import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get base path from environment variable or use default
// For GitHub Pages, set GITHUB_REPOSITORY_NAME to your repo name
// Example: GITHUB_REPOSITORY_NAME=project-bolt-sb1-uqzyxaxq
const repoName = process.env.GITHUB_REPOSITORY_NAME || 'project-bolt-sb1-uqzyxaxq';
const base = process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
