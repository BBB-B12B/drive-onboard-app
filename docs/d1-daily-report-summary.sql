-- Create table for daily report summary index
CREATE TABLE IF NOT EXISTS daily_report_summary (
  email TEXT NOT NULL,
  date TEXT NOT NULL,
  full_name TEXT,
  app_id TEXT,
  uploaded_count INTEGER DEFAULT 0,
  total_slots INTEGER DEFAULT 0,
  last_updated TEXT,
  status TEXT,
  notes TEXT,
  PRIMARY KEY (email, date)
);

-- Optional helper indexes
CREATE INDEX IF NOT EXISTS idx_daily_report_summary_date ON daily_report_summary(date);
CREATE INDEX IF NOT EXISTS idx_daily_report_summary_email ON daily_report_summary(email);
