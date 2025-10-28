const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'admin.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.exec(
  'CREATE TABLE IF NOT EXISTS candidate_overrides (electionId INTEGER, candidateId INTEGER, name TEXT, description TEXT, updatedAt TEXT, PRIMARY KEY (electionId, candidateId));' +
  'CREATE TABLE IF NOT EXISTS removed_candidates (electionId INTEGER, candidateId INTEGER, removedAt TEXT, PRIMARY KEY (electionId, candidateId));'
);

module.exports = db;
