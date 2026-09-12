import { db } from './connection';

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  company: string;
  role: string | null;
}

export interface OpportunitySummary {
  id: number;
  name: string;
  stage: string;
  amount: number;
  close_date: string | null;
  contact_name: string;
  company: string;
}

export interface OpportunityDetails extends OpportunitySummary {
  notes: string | null;
  contact_email: string | null;
}

// Search contacts by name or company (partial match, case-insensitive)
export function searchContacts(query: string): Contact[] {
  const stmt = db.prepare(`
    SELECT id, first_name, last_name, email, company, role
    FROM contacts
    WHERE first_name LIKE ?
       OR last_name LIKE ?
       OR company LIKE ?
       OR (first_name || ' ' || last_name) LIKE ?
  `);
  const pattern = `%${query}%`;
  return stmt.all(pattern, pattern, pattern, pattern) as Contact[];
}

// Search opportunities with optional filters, joined with contact info
export function searchOpportunities(filters: {
  stage?: string;
  contactName?: string;
  minAmount?: number;
}): OpportunitySummary[] {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.stage) {
    conditions.push('o.stage = ?');
    params.push(filters.stage);
  }
  if (filters.contactName) {
    conditions.push(
      "(c.first_name LIKE ? OR c.last_name LIKE ? OR (c.first_name || ' ' || c.last_name) LIKE ?)"
    );
    const pattern = `%${filters.contactName}%`;
    params.push(pattern, pattern, pattern);
  }
  if (filters.minAmount !== undefined) {
    conditions.push('o.amount >= ?');
    params.push(filters.minAmount);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const stmt = db.prepare(`
    SELECT
      o.id, o.name, o.stage, o.amount, o.close_date,
      c.first_name || ' ' || c.last_name AS contact_name,
      c.company
    FROM opportunities o
    JOIN contacts c ON c.id = o.contact_id
    ${whereClause}
    ORDER BY o.amount DESC
  `);

  return stmt.all(...params) as OpportunitySummary[];
}

// Get full details for a single opportunity, including raw notes
export function getOpportunityDetails(id: number): OpportunityDetails | undefined {
  const stmt = db.prepare(`
    SELECT
      o.id, o.name, o.stage, o.amount, o.close_date, o.notes,
      c.first_name || ' ' || c.last_name AS contact_name,
      c.email AS contact_email,
      c.company
    FROM opportunities o
    JOIN contacts c ON c.id = o.contact_id
    WHERE o.id = ?
  `);
  return stmt.get(id) as OpportunityDetails | undefined;
}