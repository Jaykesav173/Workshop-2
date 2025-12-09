# Equipment Table Schema for Supabase

## 📋 Table Name: `Equipment`

## 🔑 Columns/Attributes

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| **id** | INTEGER | PRIMARY KEY, AUTO INCREMENT, INDEXED | Unique identifier for each equipment |
| **name** | VARCHAR/TEXT | NOT NULL | Equipment name/tag (e.g., "V-101", "T-205") |
| **type** | VARCHAR/TEXT | NOT NULL | Equipment type (e.g., "Pressure Vessel", "Tank", "Heat Exchanger") |
| **location** | VARCHAR/TEXT | NULLABLE | Plant/Unit/Area location (e.g., "Plant A", "Unit 2") |
| **serial_number** | VARCHAR/TEXT | UNIQUE, NULLABLE | Equipment serial number (unique identifier) |
| **manufacturer** | VARCHAR/TEXT | NULLABLE | Equipment manufacturer name |
| **model_number** | VARCHAR/TEXT | NULLABLE | Model number from manufacturer |
| **installation_date** | TIMESTAMP | NULLABLE | Date when equipment was installed |
| **status** | VARCHAR/TEXT | DEFAULT 'ACTIVE' | Equipment status: 'ACTIVE', 'INACTIVE', 'DECOMMISSIONED' |
| **created_by** | INTEGER | FOREIGN KEY → User.id, NULLABLE | ID of the user/inspector who registered the equipment |
| **created_at** | TIMESTAMP | DEFAULT NOW() | Timestamp when equipment was created |
| **updated_at** | TIMESTAMP | DEFAULT NOW(), ON UPDATE NOW() | Timestamp when equipment was last updated |

---

## 📝 SQL CREATE TABLE Statement

```sql
CREATE TABLE "Equipment" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    serial_number VARCHAR(255) UNIQUE,
    manufacturer VARCHAR(255),
    model_number VARCHAR(255),
    installation_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_by INTEGER REFERENCES "User"(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_equipment_name ON "Equipment"(name);
CREATE INDEX idx_equipment_type ON "Equipment"(type);
CREATE INDEX idx_equipment_status ON "Equipment"(status);
CREATE INDEX idx_equipment_created_by ON "Equipment"(created_by);
```

---

## 🔗 Foreign Key Relationships

- **created_by** → References `User.id` (the inspector who created the equipment record)

---

## 📊 Required vs Optional Fields

### **Required Fields (NOT NULL):**
- `id` (auto-generated)
- `name` - Equipment name/tag
- `type` - Equipment type
- `status` - Defaults to 'ACTIVE' if not provided
- `created_at` - Auto-generated
- `updated_at` - Auto-generated

### **Optional Fields (NULLABLE):**
- `location` - Plant/Unit/Area
- `serial_number` - Unique serial number
- `manufacturer` - Manufacturer name
- `model_number` - Model number
- `installation_date` - Installation date
- `created_by` - User who created the record

---

## 💡 Example Data

```sql
INSERT INTO "Equipment" (name, type, location, serial_number, manufacturer, model_number, installation_date, status, created_by)
VALUES 
    ('V-101', 'Pressure Vessel', 'Plant A', 'PV-2024-001', 'ABC Manufacturing', 'PV-5000', '2020-01-15', 'ACTIVE', 1),
    ('T-205', 'Storage Tank', 'Plant B', 'TANK-2024-002', 'XYZ Corp', 'T-3000', '2019-06-20', 'ACTIVE', 1),
    ('HE-301', 'Heat Exchanger', 'Plant A', 'HE-2024-003', 'DEF Industries', 'HE-2000', '2021-03-10', 'ACTIVE', 1);
```

---

## 🎯 Usage in Reports Module

The Reports module uses these fields:
- **`name`** → Maps to `equipment_tag` in report header
- **`type`** → Used in `equipment_description`
- **`location`** → Maps to `plant` in report header
- **`id`** → Used to link reports and photos to equipment

---

## ✅ Validation Rules

1. **name**: Must be unique or at least descriptive (e.g., "V-101")
2. **type**: Should be a standard equipment type
3. **serial_number**: If provided, must be unique
4. **status**: Must be one of: 'ACTIVE', 'INACTIVE', 'DECOMMISSIONED'
5. **created_by**: Must reference a valid User.id if provided

---

## 🔍 Common Queries

### Get all active equipment:
```sql
SELECT * FROM "Equipment" WHERE status = 'ACTIVE';
```

### Get equipment by location:
```sql
SELECT * FROM "Equipment" WHERE location = 'Plant A';
```

### Get equipment with creator info:
```sql
SELECT e.*, u.username as created_by_username 
FROM "Equipment" e
LEFT JOIN "User" u ON e.created_by = u.id;
```

---

**Last Updated:** Current session  
**Table Owner:** Yi Jing (Equipment Information Module)


