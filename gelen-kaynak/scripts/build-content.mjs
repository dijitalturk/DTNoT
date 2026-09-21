// scripts/build-content.mjs
//
// content/webnot-content.ts, lib/store.ts ve lib/settings.ts'ten import eder.
// Ama chrome.scripting.registerContentScripts ile RUNTIME'da kaydedilen
// içerik betikleri top-level `import` İÇEREMEZ (klasik script olarak çalışır,
// ES modülü değil). Bu yüzden Vite'ın ana derlemesinden AYRI olarak, esbuild
// ile tüm bağımlılıkları TEK DOSYADA (IIFE) birleştiriyoruz.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/content/webnot-content.ts'],
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'firefox115'],
  outfile: 'dist/content/webnot-content.js',
  minify: true,
  logLevel: 'info',
});
