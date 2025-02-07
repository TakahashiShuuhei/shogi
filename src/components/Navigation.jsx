import React from 'react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0' }}>
      <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem' }}>
        <li><Link to="/">ホーム</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/users">ユーザー一覧</Link></li>
      </ul>
    </nav>
  );
};

export default Navigation; 