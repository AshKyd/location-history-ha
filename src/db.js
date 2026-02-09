
import { DatabaseSync } from 'node:sqlite';
import { config, SENSOR_COLS } from './config.js';

export class DBHelper {
  constructor() {
    this.db = new DatabaseSync(config.dbPath);
    this.columns = [];
    this.init();
  }

  init() {
    // Base schema columns for CREATE TABLE
    const baseSchemaCols = `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT,
      latitude REAL,
      longitude REAL,
      gps_accuracy INTEGER,
      altitude INTEGER,
      course INTEGER,
      speed INTEGER,
      vertical_accuracy INTEGER,
      source_type TEXT,
      state TEXT,
      UNIQUE(timestamp)
    `;

    // Dynamically build CREATE TABLE statement with only base columns
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS coordinates (
        ${baseSchemaCols}
      );
    `);

    // Schema Migration: Add new columns if they don't exist
    const KNOWN_TYPES = {
      'battery_level': 'INTEGER',
      'battery_state': 'TEXT',
      'is_charging': 'INTEGER',
      'wifi_ssid': 'TEXT',
      'network_type': 'TEXT',
      'signal_strength': 'INTEGER',
      'car_battery': 'INTEGER',
      'car_fuel_type': 'TEXT'
    };

    for (const col of SENSOR_COLS) {
      const type = KNOWN_TYPES[col] || 'TEXT';
      try {
        this.db.exec(`ALTER TABLE coordinates ADD COLUMN ${col} ${type}`);
      } catch (e) {
        // Column likely already exists, ignore
      }
    }

    // Set columns for potential reuse
    const fixedCols = ['timestamp', 'latitude', 'longitude', 'gps_accuracy', 'altitude', 'course', 'speed', 'vertical_accuracy', 'source_type', 'state'];
    this.columns = [...fixedCols, ...SENSOR_COLS];

    // Prepare insert statement
    const placeholders = this.columns.map(() => '?').join(', ');
    this.insertStmt = this.db.prepare(`
      INSERT OR REPLACE INTO coordinates (${this.columns.join(', ')}) 
      VALUES (${placeholders})
    `);
  }

  insert(record) {
    if (!this.insertStmt) throw new Error("DB not initialized");
    this.insertStmt.run(...record);
  }

  close() {
    this.db.close();
  }
}
