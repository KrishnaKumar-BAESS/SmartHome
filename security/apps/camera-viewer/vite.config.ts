import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    outDir: 'dist/web',
    rolldownOptions: { input: ['index.html', 'admin.html'] },
  },
  test: { include: ['server/**/*.test.ts'] },
});
