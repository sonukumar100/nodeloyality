  // const fs = require("fs");
  import fs from 'fs';
  // const mysql = require("mysql2/promise");
  import mysql from 'mysql2/promise';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory
dotenv.config({ path: path.join(__dirname, '../.env') });


  // Create a MariaDB connection pool
console.log("Connecting to MariaDB...",process.env.DB_HOST);

  // Test connection once at startup
  export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
  });

  try {
    const conn = await pool.getConnection();
    console.log("✅ MariaDB Connected");
    console.log("✅ MariaDB Connection ID:", conn.threadId);
    conn.release();
  } catch (err) {
    console.error("❌ MariaDB Connection Error:", err);
    process.exit(1);
  }

  // Test