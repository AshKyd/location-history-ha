
import schedule from 'node-schedule';
import { syncHistory } from './src/go.js';
import 'dotenv/config';

// Load Cron Schedule (Default: Every hour)
// Examples:
// '*/5 * * * *' = Every 5 minutes
// '0 * * * *' = Every hour
// '0 0 * * *' = Every day at midnight
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 * * * *';

console.log(`Starting Location History Sync Service...`);
console.log(`Schedule: ${CRON_SCHEDULE}`);

// Run on start
console.log('Running initial sync...');
syncHistory().then(() => {
    console.log('Initial sync complete.');
});

// Schedule Job
const job = schedule.scheduleJob(CRON_SCHEDULE, async () => {
  console.log(`[${new Date().toISOString()}] Starting scheduled sync...`);
  await syncHistory();
  console.log(`[${new Date().toISOString()}] Scheduled sync complete.`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Stopping service...');
  schedule.gracefulShutdown().then(() => process.exit(0));
});
