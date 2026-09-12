import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../crm.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

export const db = new Database(DB_PATH);

// Apply the schema every time the app starts
// (CREATE TABLE IF NOT EXISTS = safe to re-run, won't wipe existing data)
const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);