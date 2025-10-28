const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const storePath = process.env.DB_PATH || path.join(dataDir, 'admin-store.json');

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify({
      candidate_overrides: {}, // { [electionId]: { [candidateId]: { name, description, updatedAt } } }
      removed_candidates: {}   // { [electionId]: { [candidateId]: { removedAt: string } } }
    }, null, 2));
  }
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(storePath, 'utf8');
  try { return JSON.parse(raw); } catch { return { candidate_overrides: {}, removed_candidates: {} }; }
}

function writeStore(obj) {
  ensureStore();
  fs.writeFileSync(storePath, JSON.stringify(obj, null, 2));
}

function getCandidateOverrides(electionId) {
  const store = readStore();
  const eid = String(electionId);
  return store.candidate_overrides[eid] || {};
}

function setCandidateOverride(electionId, candidateId, payload) {
  const store = readStore();
  const eid = String(electionId);
  const cid = String(candidateId);
  if (!store.candidate_overrides[eid]) store.candidate_overrides[eid] = {};
  store.candidate_overrides[eid][cid] = {
    name: payload.name ?? null,
    description: payload.description ?? null,
    updatedAt: new Date().toISOString(),
  };
  writeStore(store);
}

function getRemovedCandidates(electionId) {
  const store = readStore();
  const eid = String(electionId);
  const map = store.removed_candidates[eid] || {};
  return Object.keys(map).map(Number);
}

function addRemovedCandidate(electionId, candidateId) {
  const store = readStore();
  const eid = String(electionId);
  const cid = String(candidateId);
  if (!store.removed_candidates[eid]) store.removed_candidates[eid] = {};
  store.removed_candidates[eid][cid] = { removedAt: new Date().toISOString() };
  writeStore(store);
}

module.exports = {
  getCandidateOverrides,
  setCandidateOverride,
  getRemovedCandidates,
  addRemovedCandidate,
};
