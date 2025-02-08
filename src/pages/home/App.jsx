import React, { useState, useEffect } from 'react';

export default function HomeApp() {
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

  return (
    <div>
      <h1>ホームページ</h1>
      <div className="login-status">
        {userEmail ? (
          <p>ログイン中のメールアドレス: {userEmail}</p>
        ) : (
          <p>ログインしていません</p>
        )}
      </div>

      <style>{`
        .login-status {
          margin: 20px 0;
          padding: 10px;
          background-color: #f5f5f5;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 