-- ============================================
-- Inspection Photo Table Schema
-- ============================================
-- This table links photos to inspections with group numbers and finding keys
-- Ensures photo groups persist across page refreshes

CREATE TABLE IF NOT EXISTS public."InspectionPhoto" (
    inspection_photo_id BIGSERIAL PRIMARY KEY,
    inspection_id BIGINT NOT NULL,
    photo_id BIGINT NOT NULL,
    group_number INTEGER NOT NULL,  -- Photo group number (1, 2, 3, etc.)
    photo_number VARCHAR(20),  -- Full photo number (e.g., "1.1", "1.2", "2.1")
    finding_key VARCHAR(20),  -- Linked finding key (e.g., "1.1", "2.3")
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_inspection_photo_inspection 
        FOREIGN KEY (inspection_id) 
        REFERENCES public."Inspection"(inspection_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_inspection_photo_photo 
        FOREIGN KEY (photo_id) 
        REFERENCES public."Photo"(id) 
        ON DELETE CASCADE,
    
    -- Ensure unique photo per inspection (a photo can only be in one group per inspection)
    CONSTRAINT unique_photo_per_inspection 
        UNIQUE (inspection_id, photo_id),
    
    -- Ensure unique photo_number per inspection
    CONSTRAINT unique_photo_number_per_inspection 
        UNIQUE (inspection_id, photo_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inspection_photo_inspection_id 
    ON public."InspectionPhoto"(inspection_id);

CREATE INDEX IF NOT EXISTS idx_inspection_photo_photo_id 
    ON public."InspectionPhoto"(photo_id);

CREATE INDEX IF NOT EXISTS idx_inspection_photo_group_number 
    ON public."InspectionPhoto"(inspection_id, group_number);

-- Trigger for updated_at timestamp
DROP TRIGGER IF EXISTS update_inspection_photo_updated_at ON public."InspectionPhoto";
CREATE TRIGGER update_inspection_photo_updated_at
    BEFORE UPDATE ON public."InspectionPhoto"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE public."InspectionPhoto" IS 'Links photos to inspections with group numbers and finding keys. Ensures photo grouping persists across page refreshes.';
COMMENT ON COLUMN public."InspectionPhoto".group_number IS 'Photo group number (1, 2, 3, etc.) - corresponds to observation number';
COMMENT ON COLUMN public."InspectionPhoto".photo_number IS 'Full photo number (e.g., "1.1", "1.2", "2.1") - group_number.sub_number';
COMMENT ON COLUMN public."InspectionPhoto".finding_key IS 'Linked finding key (e.g., "1.1", "2.3") - links photo to a specific finding';

