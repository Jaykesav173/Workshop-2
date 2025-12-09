-- ============================================
-- Observation Tables Schema
-- ============================================
-- This schema stores observations, findings, and recommendations
-- for inspections. Observations are linked to inspections via inspection_id.

-- 1. Observation Table (Main table)
CREATE TABLE IF NOT EXISTS public."Observation" (
    observation_id BIGSERIAL PRIMARY KEY,
    inspection_id BIGINT NOT NULL,
    component VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    observation_type VARCHAR(100),
    severity VARCHAR(50),
    status VARCHAR(50) DEFAULT 'OPEN',
    priority VARCHAR(50) DEFAULT 'MEDIUM',
    action_required VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to Inspection table
    CONSTRAINT fk_observation_inspection 
        FOREIGN KEY (inspection_id) 
        REFERENCES public."Inspection"(inspection_id) 
        ON DELETE CASCADE
);

-- 2. Finding Table (One-to-many with Observation)
CREATE TABLE IF NOT EXISTS public."Finding" (
    finding_id BIGSERIAL PRIMARY KEY,
    observation_id BIGINT NOT NULL,
    finding_key VARCHAR(20) NOT NULL,  -- e.g., "1.1", "1.2", "2.1"
    finding_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to Observation table
    CONSTRAINT fk_finding_observation 
        FOREIGN KEY (observation_id) 
        REFERENCES public."Observation"(observation_id) 
        ON DELETE CASCADE,
    
    -- Ensure unique finding keys per observation
    CONSTRAINT unique_finding_key_per_observation 
        UNIQUE (observation_id, finding_key)
);

-- 3. Recommendation Table (One-to-many with Observation)
CREATE TABLE IF NOT EXISTS public."Recommendation" (
    recommendation_id BIGSERIAL PRIMARY KEY,
    observation_id BIGINT NOT NULL,
    recommendation_key VARCHAR(20) NOT NULL,  -- e.g., "1.1", "1.2", "2.1"
    recommendation_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key to Observation table
    CONSTRAINT fk_recommendation_observation 
        FOREIGN KEY (observation_id) 
        REFERENCES public."Observation"(observation_id) 
        ON DELETE CASCADE,
    
    -- Ensure unique recommendation keys per observation
    CONSTRAINT unique_recommendation_key_per_observation 
        UNIQUE (observation_id, recommendation_key)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Index on inspection_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_observation_inspection_id 
    ON public."Observation"(inspection_id);

-- Index on observation_id for findings
CREATE INDEX IF NOT EXISTS idx_finding_observation_id 
    ON public."Finding"(observation_id);

-- Index on observation_id for recommendations
CREATE INDEX IF NOT EXISTS idx_recommendation_observation_id 
    ON public."Recommendation"(observation_id);

-- ============================================
-- Triggers for updated_at timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Observation table
DROP TRIGGER IF EXISTS update_observation_updated_at ON public."Observation";
CREATE TRIGGER update_observation_updated_at
    BEFORE UPDATE ON public."Observation"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for Finding table
DROP TRIGGER IF EXISTS update_finding_updated_at ON public."Finding";
CREATE TRIGGER update_finding_updated_at
    BEFORE UPDATE ON public."Finding"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for Recommendation table
DROP TRIGGER IF EXISTS update_recommendation_updated_at ON public."Recommendation";
CREATE TRIGGER update_recommendation_updated_at
    BEFORE UPDATE ON public."Recommendation"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE public."Observation" IS 'Stores observation records for inspections. Each observation can have multiple findings and recommendations.';
COMMENT ON TABLE public."Finding" IS 'Stores findings associated with observations. Finding keys follow the pattern X.Y where X is observation number and Y is sequential.';
COMMENT ON TABLE public."Recommendation" IS 'Stores recommendations associated with observations. Recommendation keys follow the pattern X.Y where X is observation number and Y is sequential.';

COMMENT ON COLUMN public."Observation".observation_id IS 'Primary key, auto-incrementing observation ID';
COMMENT ON COLUMN public."Observation".inspection_id IS 'Foreign key to Inspection table';
COMMENT ON COLUMN public."Observation".component IS 'Component name where observation was made';
COMMENT ON COLUMN public."Observation".location IS 'Location of the observation';
COMMENT ON COLUMN public."Observation".observation_type IS 'Type of observation (e.g., VISUAL, NDT, etc.)';
COMMENT ON COLUMN public."Observation".severity IS 'Severity level (LOW, MEDIUM, HIGH, CRITICAL)';
COMMENT ON COLUMN public."Observation".status IS 'Status of observation (OPEN, CLOSED, etc.)';
COMMENT ON COLUMN public."Observation".priority IS 'Priority level (LOW, MEDIUM, HIGH, CRITICAL)';
COMMENT ON COLUMN public."Observation".action_required IS 'Action required for this observation';

COMMENT ON COLUMN public."Finding".finding_key IS 'Finding number key (e.g., "1.1", "1.2", "2.1")';
COMMENT ON COLUMN public."Finding".finding_text IS 'Text description of the finding';
COMMENT ON COLUMN public."Recommendation".recommendation_key IS 'Recommendation number key (e.g., "1.1", "1.2", "2.1")';
COMMENT ON COLUMN public."Recommendation".recommendation_text IS 'Text description of the recommendation';

