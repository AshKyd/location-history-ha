import { formatInTimeZone } from 'date-fns-tz';
import { config, SENSOR_COLS } from './config.js';
import { fetchHomeAssistantHistory } from './fetchHomeAssistantHistory.js';
import { DBHelper } from './db.js';

// Helper to round number
const round = (val) => val === null || val === undefined ? null : Math.round(Number(val));

export async function syncHistory() {
  const db = new DBHelper();

  try {
    const allEvents = await fetchHomeAssistantHistory();
    
    let savedCount = 0;
    
    // Track current state dynamically
    const currentStates = {};
    SENSOR_COLS.forEach(col => currentStates[col] = null);
    
    console.log(`Processing ${allEvents.length} events...`);

    for (const entry of allEvents) {
      const entityId = entry.entity_id;
      
      // Update sensor cache
      if (config.sensors[entityId]) {
         const colName = config.sensors[entityId];
         const val = entry.state;
         
         // Custom processing logic based on column name patterns
         if (colName === 'is_charging') {
            // Binary sensor: 'on' = 1, 'off' = 0, otherwise null
            if (val === 'on') currentStates[colName] = 1;
            else if (val === 'off') currentStates[colName] = 0;
            else currentStates[colName] = null;
         } else if (colName.includes('battery_level') || colName.includes('signal_strength') || colName.includes('car_battery')) {
             currentStates[colName] = isNaN(Number(val)) ? null : Math.round(Number(val));
         } else {
             // For text fields (wifi_ssid, network_type, battery_state, car_fuel_type)
             currentStates[colName] = (val === 'unavailable' || val === 'unknown') ? null : val;
         }
      }

      // Process Tracker Update
      if (entityId === config.trackerId) {
        const lat = entry.attributes?.latitude;
        const lon = entry.attributes?.longitude;
        const timeUtc = entry.last_updated;

        if (lat && lon) {
          // Convert timestamp to configured timezone
          const timeTz = formatInTimeZone(new Date(timeUtc), config.timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");

          const args = [
             timeTz, 
             lat,
             lon,
             round(entry.attributes?.gps_accuracy),
             round(entry.attributes?.altitude),
             round(entry.attributes?.course),
             round(entry.attributes?.speed),
             round(entry.attributes?.vertical_accuracy),
             entry.attributes?.source_type ?? null,
             entry.state ?? null,
             // Map dynamic sensor columns in correct order
             ...SENSOR_COLS.map(col => currentStates[col])
          ];
          
          db.insert(args);
          savedCount++;
        }
      }
    }

    console.log(`Success! Processed ${allEvents.length} events. Saved ${savedCount} records.`);

  } catch (error) {
    console.error('Failed to poll location:', error);
  } finally {
    db.close();
  }
}