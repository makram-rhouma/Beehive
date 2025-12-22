import { defineConfig } from 'vite';

import path from 'node:path';
import fs from 'node:fs/promises';

async function copyDir(srcDir, destDir) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  await fs.mkdir(destDir, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export default defineConfig({
  base: './',
  appType: 'spa',
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true
  },
  plugins: [
    {
      name: 'copy-static-folders',
      apply: 'build',
      async closeBundle() {
        const outDir = path.resolve(process.cwd(), 'docs');

        for (const dir of ['img', 'data']) {
          const src = path.resolve(process.cwd(), dir);
          const dest = path.join(outDir, dir);
          try {
            await fs.access(src);
            await copyDir(src, dest);
          } catch {
          }
        }
      }
    }
  ]
});
