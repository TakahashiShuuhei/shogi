import React from 'react';
import { hydrateRoot } from 'react-dom/client';

export default function createPage(App) {
  const initialData = window.__INITIAL_DATA__;
  
  hydrateRoot(
    document.getElementById('root'),
    <App initialData={initialData} />
  );
} 