-- schema.sql
-- This file defines the database schema for our drink company website.

-- Drop the 'drinks' table if it already exists to ensure a clean slate
-- This is useful during development for fresh database setups.
DROP TABLE IF EXISTS drinks;

-- Create the 'drinks' table with new fields
CREATE TABLE drinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Unique identifier for each drink, auto-increments
    name TEXT NOT NULL,                     -- Name of the drink (cannot be empty)
    description TEXT,                       -- Description of the drink (can be empty)
    price REAL NOT NULL,                    -- Price of the drink (cannot be empty, uses REAL for decimal numbers)
    batch_no TEXT NOT NULL,                 -- New: Batch number for tracking
    expiry_date TEXT NOT NULL,              -- New: Expiry date (stored as TEXT in YYYY-MM-DD format)
    quantity INTEGER NOT NULL,              -- New: Quantity in stock
    drink_subtype TEXT NOT NULL             -- New: Subtype of the drink (e.g., "Soda", "Juice", "Water")
);

-- Optional: Insert some initial data into the drinks table with new fields
-- These are example drinks that will appear when the database is first initialized.
INSERT INTO drinks (name, description, price, batch_no, expiry_date, quantity, drink_subtype) VALUES
('Sparkling Water', 'Crisp and refreshing carbonated water.', 2.50, 'BW-001', '2026-12-31', 500, 'Water');
INSERT INTO drinks (name, description, price, batch_no, expiry_date, quantity, drink_subtype) VALUES
('Orange Juice', 'Freshly squeezed orange juice, rich in Vitamin C.', 3.00, 'OJ-005', '2025-08-15', 250, 'Juice');
INSERT INTO drinks (name, description, price, batch_no, expiry_date, quantity, drink_subtype) VALUES
('Lemonade', 'Sweet and tangy homemade lemonade, perfect for summer.', 3.50, 'LM-010', '2025-09-30', 300, 'Soda');
INSERT INTO drinks (name, description, price, batch_no, expiry_date, quantity, drink_subtype) VALUES
('Cola Classic', 'The original fizzy cola drink.', 2.75, 'CC-022', '2026-03-01', 400, 'Soda');
