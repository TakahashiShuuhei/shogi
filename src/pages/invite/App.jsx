import React, { useState } from 'react';

export default function InviteApp() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setEmail(''); // フォームをクリア
      } else {
        setStatus('error');
        setMessage(data.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage('エラーが発生しました。もう一度お試しください。');
    }
  };

  return (
    <div className="container">
      <h1>ユーザーを招待</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">メールアドレス:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
          />
        </div>

        <button 
          type="submit" 
          disabled={status === 'loading'}
        >
          {status === 'loading' ? '送信中...' : '招待を送信'}
        </button>

        {message && (
          <div className={`message ${status === 'success' ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </form>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        label {
          display: block;
          margin-bottom: 5px;
        }
        
        input {
          width: 100%;
          padding: 8px;
          font-size: 16px;
        }
        
        button {
          padding: 10px 20px;
          font-size: 16px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        button:disabled {
          background-color: #ccc;
        }
        
        .message {
          margin-top: 15px;
          padding: 10px;
          border-radius: 4px;
        }
        
        .success {
          background-color: #d4edda;
          color: #155724;
        }
        
        .error {
          background-color: #f8d7da;
          color: #721c24;
        }
      `}</style>
    </div>
  );
} 