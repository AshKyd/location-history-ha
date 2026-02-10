
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

// Parse SENSORS from environment variable string (HA_SENSORS="col_name:entity_id,col2:entity2")
if (process.env.HA_SENSORS) {
  const parts = process.env.HA_SENSORS.split(',');
  parts.forEach(part => {
    // Support "col:entity" or "col=entity"
    const [colName, entityId] = part.split(/[:=]/).map(s => s.trim());
    
    if (colName && entityId) {
       // Remove quotes if user accidentally included them
       const cleanCol = colName.replace(/['"]/g, '').toLowerCase();
       const cleanEntity = entityId.replace(/['"]/g, '');
       config.sensors[cleanEntity] = cleanCol;
    }
  });
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
