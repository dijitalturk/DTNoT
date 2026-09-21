import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

// Not: content script BİLİNÇLİ olarak manifest'e declarative eklenmiyor.
// background/index.ts, izin verildiğinde chrome.scripting.registerContentScripts
// ile RUNTIME'da kaydediyor — böylece kurulumda zorunlu host izni istenmiyor
// (Firefox 127+ declarative content_scripts'i kurulum ekranında zorunlu kılıyor).
export default defineManifest({
  manifest_version: 3,
  name: 'Web Not — Sayfada Not Bırak',
  version: pkg.version,
  description: 'Gezindiğin web sayfalarına özel notlar bırak; sayfayı her açtığında sol altta karşına çıksın.',
  icons: {
    48: 'public/icons/icon-48.png',
    96: 'public/icons/icon-96.png',
    128: 'public/icons/icon-128.png',
  },
  action: {
    default_title: 'Web Not',
    default_popup: 'src/popup/index.html',
    default_icon: {
      48: 'public/icons/icon-48.png',
      96: 'public/icons/icon-96.png',
    },
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: ['storage', 'scripting', 'contextMenus'],
  optional_host_permissions: ['*://*/*'],
  browser_specific_settings: {
    gecko: {
      id: 'web-not@dijitalturk',
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] },
    },
  },
});
