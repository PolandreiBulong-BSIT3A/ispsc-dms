import mysql from 'mysql2';
import dotenv from 'dotenv';

// Load env in case this module is imported before server.js calls dotenv.config()
dotenv.config();

const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
const dbUser = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || '';
const dbPort = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306);

// Optional SSL support (Hostinger/Cloud DBs may require it)
// Set DB_SSL=true to enable. Optionally provide DB_SSL_CA (base64 or path), DB_SSL_REJECT_UNAUTHORIZED=false for self-signed.
let ssl = undefined;
const useSsl = String(process.env.DB_SSL || '').toLowerCase() === 'true';
if (useSsl) {
  ssl = { rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true' };
}

const db = mysql.createPool({
  host: dbHost,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  port: dbPort,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  ssl,
});

// Test the connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('✅ Connected to the database successfully');
    connection.release();
  }
});

export default db;
