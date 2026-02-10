
import 'dotenv/config';

// Ensure required variables are set
if (!process.env.HA_URL || !process.env.HA_TOKEN) {
  console.error('Error: HA_URL and HA_TOKEN must be set in .env file.');
  process.exit(1);
}

// Configuration Object
export const config = {
  haUrl: process.env.HA_URL,
  haToken: process.env.HA_TOKEN,
  trackerId: process.env.TRACKER_ID || 'device_tracker.pixel_9_pro',
  dbPath: process.env.DB_PATH || './location_history.db',
  historyDays: parseInt(process.env.HISTORY_DAYS || '1', 10),
  timezone: process.env.TIMEZONE || 'UTC', // e.g. 'Australia/Brisbane'
  sensors: {}
};

// Parse SENSORS from JSON environment variable (HA_SENSORS='{"col_name": "entity_id"}')
if (process.env.HA_SENSORS) {
  try {
    const sensorsMap = JSON.parse(process.env.HA_SENSORS);
    Object.entries(sensorsMap).forEach(([colName, entityId]) => {
      config.sensors[entityId] = colName.toLowerCase();
    });
  } catch (error) {
    console.error('Failed to parse HA_SENSORS environment variable as JSON:', error.message);
  }
}

// Parse SENSORS from individual environment variables (HA_SENSOR_COLUMN_NAME=entity_id)
Object.keys(process.env).forEach(key => {
  if (key.startsWith('HA_SENSOR_')) {
    const colName = key.replace('HA_SENSOR_', '').toLowerCase();
    const entityId = process.env[key];
    if (entityId) {
      config.sensors[entityId] = colName;
    }
  }
});

export const SENSOR_COLS = Object.values(config.sensors);
export const ALL_ENTITIES = [config.trackerId, ...Object.keys(config.sensors)];
