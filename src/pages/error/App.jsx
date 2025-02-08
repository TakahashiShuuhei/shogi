import React from 'react';

export default function ErrorApp({ message }) {
  return (
    <div className="error-container">
      <h1>エラー</h1>
      <p>{message || 'エラーが発生しました'}</p>
      <a href="/">トップページへ</a>

      <style>{`
        .error-container {
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
} 