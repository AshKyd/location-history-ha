
import { config, ALL_ENTITIES } from './config.js';

/**
 * Fetches history from Home Assistant for the configured time window.
 * @returns {Promise<Array>} Flattened and sorted array of event objects
 */
export async function fetchHomeAssistantHistory() {
  // Calculate time window
  const now = new Date();
  const startTime = new Date(now.getTime() - config.historyDays * 24 * 60 * 60 * 1000).toISOString();
  const endTime = now.toISOString();
  
  const entityFilter = ALL_ENTITIES.join(',');
  const apiUrl = `${config.haUrl}/api/history/period/${startTime}?end_time=${endTime}&filter_entity_id=${entityFilter}`;

  console.log(`Polling history from ${startTime} to ${endTime} (${config.historyDays} day${config.historyDays === 1 ? '' : 's'})...`);

  const response = await fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${config.haToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HA API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // Flatten and Sort
  // HA returns array of arrays (one per entity). Flatten to single stream.
  return data.flat().sort((a, b) => 
    new Date(a.last_updated).getTime() - new Date(b.last_updated).getTime()
  );
}
