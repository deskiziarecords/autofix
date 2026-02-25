
-- PostgreSQL Database Schema for AutoFix Pro

-- Create Enum Types for Statuses
CREATE TYPE job_status AS ENUM ('PENDING', 'INSPECTING', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'PAID');
CREATE TYPE part_condition AS ENUM ('new', 'used', 'refurbished');

-- Vehicles Table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_plate VARCHAR(20) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    contact_info VARCHAR(100) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    complaint TEXT,
    status job_status DEFAULT 'PENDING',
    payment_status payment_status DEFAULT 'PENDING',
    mechanic_name VARCHAR(255),
    damaged_part_photo TEXT, -- Base64 encoded or URL
    hours_spent DECIMAL(10, 2) DEFAULT 0.00,
    job_description TEXT,
    final_amount DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parts Table
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    labor_estimate DECIMAL(15, 2) NOT NULL,
    condition part_condition DEFAULT 'new',
    source VARCHAR(255),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching license plates
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
