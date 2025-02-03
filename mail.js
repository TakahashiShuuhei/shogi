// dotenv を使って .env ファイルから環境変数を読み込み（ローカル開発時のみ）
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail() {
  try {
    const msg = {
      to: 'uhiaha888+to@gmail.com', // 受信者のメールアドレス
      from: 'uhiaha888@gmail.com',  // 送信元のメール。SendGridで認証済みのアドレスを使用してください
      subject: 'テストメール from Render',
      text: 'これは Render から SendGrid を利用して送信したテストメールです。',
      html: '<p>これは <strong>Render</strong> から SendGrid を利用して送信したテストメールです。</p>',
    };
    await sgMail.send(msg);
    console.log('メール送信に成功しました！');
  } catch (error) {
    console.error('メール送信に失敗しました:', error);
  }
}

// 関数を実行してメール送信
// sendEmail(); 