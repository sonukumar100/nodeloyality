import cron from 'node-cron';
import { pool } from '../db/index.js';

cron.schedule('*/1 * * * *', async () => {
  console.log('Cron job triggered...');

  const now = new Date();
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfPreviousMonth = previousMonth.toISOString().split('T')[0];
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    .toISOString()
    .split('T')[0];

  try {
    const query = `
      DELETE FROM users
      WHERE DATE(createdAt) BETWEEN ? AND ?
    `;
    const values = [startOfPreviousMonth, endOfPreviousMonth];

    const [result] = await pool.query(query, values);
    console.log(`Deleted ${result.affectedRows} users from previous month.`);
  } catch (error) {
    console.error('Error deleting users:', error);
  }
});
