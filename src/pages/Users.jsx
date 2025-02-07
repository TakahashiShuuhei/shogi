import React from 'react';

const Users = () => {
  const users = [
    { id: 1, name: '田中太郎' },
    { id: 2, name: '山田花子' },
    { id: 3, name: '佐藤次郎' }
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h1>ユーザー一覧</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Users; 