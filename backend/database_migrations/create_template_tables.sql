-- ============================================
-- Template Management Tables
-- FindingTemplate and RecommendationTemplate
-- ============================================

-- Finding Template Table
CREATE TABLE IF NOT EXISTS "FindingTemplate" (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_by INTEGER,
    is_active VARCHAR(10) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_finding_template_user FOREIGN KEY (created_by) REFERENCES "User"(id)
);

-- Recommendation Template Table
CREATE TABLE IF NOT EXISTS "RecommendationTemplate" (
    id SERIAL PRIMARY KEY,
    label VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_by INTEGER,
    is_active VARCHAR(10) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recommendation_template_user FOREIGN KEY (created_by) REFERENCES "User"(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_finding_template_active ON "FindingTemplate"(is_active);
CREATE INDEX IF NOT EXISTS idx_finding_template_created_by ON "FindingTemplate"(created_by);
CREATE INDEX IF NOT EXISTS idx_recommendation_template_active ON "RecommendationTemplate"(is_active);
CREATE INDEX IF NOT EXISTS idx_recommendation_template_created_by ON "RecommendationTemplate"(created_by);

-- Insert default/seed data (optional - based on original hardcoded templates)
-- Finding Templates
INSERT INTO "FindingTemplate" (label, text, is_active) VALUES
('External - Coating condition', 'Generally, equipment was found fully painted with no significant paint breakdown.', 'ACTIVE'),
('External - No leakage', 'No leakage traces observed on shell, heads, flanges or piping attachments.', 'ACTIVE'),
('Internal - Surfaces clean', 'Internal surfaces observed generally clean with minor light rust staining.', 'ACTIVE'),
('Internal - Localised corrosion', 'Localised general corrosion noted around lower skirt support region.', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Recommendation Templates
INSERT INTO "RecommendationTemplate" (label, text, is_active) VALUES
('Touch-up coating', 'Touch up paint coating at affected areas.', 'ACTIVE'),
('Monitor corrosion', 'Continue to monitor localised corrosion areas during next turnaround.', 'ACTIVE'),
('Repair insulation', 'Repair damaged insulation cladding to prevent moisture ingress.', 'ACTIVE'),
('Hydrotest / Fitness check', 'Perform hydrostatic test / fitness-for-service evaluation.', 'ACTIVE')
ON CONFLICT DO NOTHING;

