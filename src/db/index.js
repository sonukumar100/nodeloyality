  // const fs = require("fs");
  import fs from 'fs';
  // const mysql = require("mysql2/promise");
  import mysql from 'mysql2/promise';


  // Create a MariaDB connection pool


  // Test connection once at startup
  export const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "loyalty",
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