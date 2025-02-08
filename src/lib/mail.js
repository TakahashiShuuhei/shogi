// dotenv を使って .env ファイルから環境変数を読み込み（ローカル開発時のみ）
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail({ to, from = "uhiaha888@gmail.com", subject, text, html }) {
  try {
    const msg = {
      to,
      from,
      subject,
      text,
      html: html || text, // html が指定されていない場合は text を使用
    };
    
    await sgMail.send(msg);
    console.log(`メール送信に成功しました！ To: ${to}`);
    return true;
  } catch (error) {
    console.error('メール送信に失敗しました:', error);
    throw error;
  }
}

// テスト用の関数として残しておく（オプション）
export async function sendTestEmail() {
  return sendEmail({
    to: 'uhiaha888+to@gmail.com',
    subject: 'テストメール from Render',
    text: 'これは Render から SendGrid を利用して送信したテストメールです。',
    html: '<p>これは <strong>Render</strong> から SendGrid を利用して送信したテストメールです。</p>',
  });
}

// 関数を実行してメール送信
// sendTestEmail(); 