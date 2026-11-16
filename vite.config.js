import { defineConfig } from 'vite';

const isGitHubPagesBuild = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: isGitHubPagesBuild ? '/Vertualworld/' : '/',
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three'],
        },
      },
    },
  },
});
