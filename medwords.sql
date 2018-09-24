CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patient(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL, 
  date DATE NOT NULL
);
