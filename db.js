// dotenv を使って .env ファイルから環境変数を読み込み（ローカル開発時のみ）
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  console.log('dotenv.config()');
  dotenv.config();
}
import pkg from 'pg';
const { Client } = pkg;

// 環境変数 DATABASE_URL を利用して接続文字列を取得
const connectionString = process.env.DATABASE_URL;

// 接続先が Render のデータベースの場合は SSL を有効にするように設定
const isRemoteDB = connectionString.includes("render.com");

const client = new Client({
  connectionString,
  ssl: (process.env.NODE_ENV === 'production' || isRemoteDB) ? { rejectUnauthorized: false } : false,
});

client.connect()
  .then(() => console.log("PostgreSQL に接続成功！"))
  .catch((err) => console.error("PostgreSQL 接続エラー: ", err));

export default client;