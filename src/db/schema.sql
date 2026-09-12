-- Contacts table (people at client companies)
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  company TEXT NOT NULL,
  role TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Opportunities table (ongoing sales deals)
CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN (
    'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
  )),
  amount REAL NOT NULL,
  close_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
);