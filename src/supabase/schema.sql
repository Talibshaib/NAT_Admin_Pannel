-- Schema for Toll Registration System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create toll_booths table
CREATE TABLE IF NOT EXISTS toll_booths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  upi_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create toll_passes table
CREATE TABLE IF NOT EXISTS toll_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  toll_booth_id UUID REFERENCES toll_booths(id) ON DELETE CASCADE,
  vehicle_number TEXT NOT NULL,
  pass_type TEXT NOT NULL, -- 'single', 'daily', 'monthly', 'yearly'
  amount DECIMAL(10, 2) NOT NULL,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create toll_transactions table
CREATE TABLE IF NOT EXISTS toll_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  toll_booth_id UUID REFERENCES toll_booths(id) ON DELETE CASCADE,
  toll_pass_id UUID REFERENCES toll_passes(id) NULL,
  vehicle_number TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'upi', 'cash', 'pass'
  payment_status TEXT NOT NULL, -- 'completed', 'pending', 'failed'
  transaction_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security Policies
ALTER TABLE toll_booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE toll_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE toll_transactions ENABLE ROW LEVEL SECURITY;

-- Toll booth owners can only see and manage their own toll booths
CREATE POLICY "Users can view their own toll booths" 
  ON toll_booths FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own toll booths" 
  ON toll_booths FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own toll booths" 
  ON toll_booths FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own toll booths" 
  ON toll_booths FOR DELETE 
  USING (auth.uid() = user_id);

-- Toll booth owners can only manage passes for their toll booths
CREATE POLICY "Users can view passes for their toll booths" 
  ON toll_passes FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM toll_booths 
    WHERE toll_booths.id = toll_passes.toll_booth_id 
    AND toll_booths.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert passes for their toll booths" 
  ON toll_passes FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM toll_booths 
    WHERE toll_booths.id = toll_passes.toll_booth_id 
    AND toll_booths.user_id = auth.uid()
  ));

CREATE POLICY "Users can update passes for their toll booths" 
  ON toll_passes FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM toll_booths 
    WHERE toll_booths.id = toll_passes.toll_booth_id 
    AND toll_booths.user_id = auth.uid()
  ));

-- Toll booth owners can only manage transactions for their toll booths
CREATE POLICY "Users can view transactions for their toll booths" 
  ON toll_transactions FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM toll_booths 
    WHERE toll_booths.id = toll_transactions.toll_booth_id 
    AND toll_booths.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert transactions for their toll booths" 
  ON toll_transactions FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM toll_booths 
    WHERE toll_booths.id = toll_transactions.toll_booth_id 
    AND toll_booths.user_id = auth.uid()
  ));

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update updated_at on toll_booths
CREATE TRIGGER update_toll_booths_updated_at
BEFORE UPDATE ON toll_booths
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column(); 