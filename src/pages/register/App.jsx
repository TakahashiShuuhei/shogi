import React, { useEffect } from 'react';

export default function RegisterApp({ email, gameId }) {
  useEffect(() => {
    console.log('Register: email =', email, 'gameId =', gameId);  // デバッグ用
    // メールアドレスを保存
    localStorage.setItem('userEmail', email);
    
    // 保存完了後にリダイレクト
    const redirectTo = gameId ? `/games/${gameId}` : '/';
    window.location.href = redirectTo;
  }, [email, gameId]);

  return (
    <div className="register-container">
      <p>認証中...</p>
      <style>{`
        .register-container {
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
} 