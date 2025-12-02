import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Get base path from environment variable for GitHub Pages
const repoName = process.env.GITHUB_REPOSITORY_NAME || 'demo-termopane';
const base = process.env.GITHUB_PAGES === 'true' ? `/${repoName}/` : '/';

// Debug logging
if (process.env.GITHUB_PAGES === 'true') {
  console.log(`[Vite Config] Building for GitHub Pages with base: ${base}`);
}

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Ensure assets use the base path
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});