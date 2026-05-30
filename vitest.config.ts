// ArcGov — arcgov.vercel.app
// Vitest config. Run the tests with:  npm test
// (Tests live next to the code they check, in files ending .test.ts)
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Lets tests use the same "@/..." imports as the app.
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
