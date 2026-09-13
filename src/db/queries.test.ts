import { describe, it, expect, vi, beforeEach } from 'vitest';

const testDb = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const fs = require('fs');
  const path = require('path');
  const db = new Database(':memory:');
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  return db;
});

vi.mock('./connection', () => ({ db: testDb }));

import { searchContacts, searchOpportunities, getOpportunityDetails } from './queries';

function resetTestData() {
  testDb.exec('DELETE FROM opportunities');
  testDb.exec('DELETE FROM contacts');

  testDb
    .prepare(`INSERT INTO contacts (id, first_name, last_name, email, company, role) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(1, 'Marc', 'Dubreuil', 'm.dubreuil@test.fr', 'Atlantique Logistique', 'Directeur des Achats');

  testDb
    .prepare(`INSERT INTO contacts (id, first_name, last_name, email, company, role) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(2, 'Sophie', 'Lenoir', 's.lenoir@test.com', 'Nordis Retail', 'Responsable IT');

  testDb
    .prepare(
      `INSERT INTO opportunities (id, contact_id, name, stage, amount, close_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(1, 1, 'Renouvellement contrat', 'negotiation', 45000, '2026-10-15', 'Notes test 1');

  testDb
    .prepare(
      `INSERT INTO opportunities (id, contact_id, name, stage, amount, close_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(2, 2, 'Migration plateforme', 'proposal', 78000, '2026-11-30', 'Notes test 2');
}

describe('searchContacts', () => {
  beforeEach(resetTestData);

  it('finds a contact by partial last name', () => {
    const results = searchContacts('Dubr');
    expect(results).toHaveLength(1);
    expect(results[0].last_name).toBe('Dubreuil');
  });

  it('finds a contact by full name (first + last concatenated)', () => {
    const results = searchContacts('Marc Dubreuil');
    expect(results).toHaveLength(1);
    expect(results[0].first_name).toBe('Marc');
  });

  it('returns an empty array when no contact matches', () => {
    const results = searchContacts('Inexistant');
    expect(results).toHaveLength(0);
  });
});

describe('searchOpportunities', () => {
  beforeEach(resetTestData);

  it('filters by stage', () => {
    const results = searchOpportunities({ stage: 'negotiation' });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Renouvellement contrat');
  });

  it('filters by contact name', () => {
    const results = searchOpportunities({ contactName: 'Sophie' });
    expect(results).toHaveLength(1);
    expect(results[0].company).toBe('Nordis Retail');
  });

  it('filters by minAmount', () => {
    const results = searchOpportunities({ minAmount: 50000 });
    expect(results).toHaveLength(1);
    expect(results[0].amount).toBe(78000);
  });

  it('combines multiple filters', () => {
    const results = searchOpportunities({ stage: 'proposal', minAmount: 50000 });
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Migration plateforme');
  });

  it('returns all opportunities when no filter is given', () => {
    const results = searchOpportunities({});
    expect(results).toHaveLength(2);
  });
});

describe('getOpportunityDetails', () => {
  beforeEach(resetTestData);

  it('returns full details for an existing opportunity', () => {
    const result = getOpportunityDetails(1);
    expect(result).toBeDefined();
    expect(result?.notes).toBe('Notes test 1');
    expect(result?.contact_name).toBe('Marc Dubreuil');
  });

  it('returns undefined for a non-existing id', () => {
    const result = getOpportunityDetails(999);
    expect(result).toBeUndefined();
  });
});