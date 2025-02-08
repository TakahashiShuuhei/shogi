import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';

const initialData = JSON.parse(
  document.getElementById('initial-data')?.textContent || '{}'
);

hydrateRoot(
  document.getElementById('root'),
  <App {...initialData} />
); 