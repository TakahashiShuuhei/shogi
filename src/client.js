import React from 'react';
import { hydrateRoot } from 'react-dom/client';

// 各ページのエントリーポイントを追加
const pages = {
  home: () => import('./pages/home/App'),
  about: () => import('./pages/about/App'),
  'shogi-test': () => import('./pages/shogi-test/App'),
  invite: () => import('./pages/invite/App'),
  register: () => import('./pages/register/App'),
  error: () => import('./pages/error/App'),
};

// ページ名を取得
const pageName = document.documentElement.dataset.pageName;

// 対応するコンポーネントを動的にインポート
if (pageName && pages[pageName]) {
  pages[pageName]().then(({ default: App }) => {
    const initialData = JSON.parse(
      document.getElementById('initial-data')?.textContent || '{}'
    );
    
    hydrateRoot(
      document.getElementById('root'),
      <App {...initialData} />
    );
  });
} 