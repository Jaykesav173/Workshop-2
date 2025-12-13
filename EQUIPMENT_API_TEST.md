# Equipment API Testing Guide

## ✅ RLS Setup Confirmed

- **RLS Status**: Enabled but fully open for testing
- **Policies**: Public SELECT, INSERT, UPDATE, DELETE
- **Access**: No authentication required (temporary for testing)

## 🔍 Testing the Equipment API

### 1. **Test via Browser/Postman**

```bash
# Get all equipment
GET http://127.0.0.1:8000/api/equipment/
Headers: Authorization: Bearer <your-token>
```

### 2. **Check Backend Logs**

When you call the API, you should see:
```
DEBUG: Equipment query result: [...]
DEBUG: Returning X equipment items
DEBUG API: Returning X equipment items
```

### 3. **Check Frontend Console**

Open browser DevTools (F12) and look for:
```
Equipment API Response: [...]
```

### 4. **Verify Database**

Make sure you have equipment records in the `equipment` table:

```sql
SELECT * FROM equipment;
```

If empty, insert test data:
```sql
INSERT INTO equipment (equipment_tag_no, location, status, equipment_description)
VALUES 
    ('V-101', 'Plant A', 'Active', 'Pressure Vessel'),
    ('T-205', 'Plant B', 'Active', 'Storage Tank'),
    ('HE-301', 'Plant A', 'Active', 'Heat Exchanger');
```

## 🐛 Troubleshooting

### Issue: Dropdown is empty

**Check 1**: Backend logs show data?
- ✅ If YES → Frontend issue (check console)
- ❌ If NO → Database issue (check table)

**Check 2**: Browser console shows response?
- ✅ If YES → Check response format
- ❌ If NO → Check API endpoint URL

**Check 3**: API returns 200 OK?
- ✅ If YES → Check response data structure
- ❌ If NO → Check authentication/RLS

### Common Fixes

1. **Empty Table**: Insert test equipment records
2. **Wrong Table Name**: Verify it's `equipment` (lowercase)
3. **Response Parsing**: Check Pydantic schema matches DB columns
4. **CORS Issues**: Check CORS settings in `main.py`

## 📊 Expected Response Format

```json
[
  {
    "id": 1,
    "equipment_tag_no": "V-101",
    "type_id": null,
    "material": null,
    "location": "Plant A",
    "inspection_due_date": null,
    "equipment_description": "Pressure Vessel",
    "dosh_registration_no": null,
    "nominal_thickness": null,
    "corrosion_allowance": null,
    "design_pressure": null,
    "design_temperature": null,
    "status": "Active",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": null,
    "name": "V-101",  // Backward compatibility
    "type": ""         // Backward compatibility
  }
]
```

## 🚀 Quick Test Script

```python
# test_equipment.py
import requests

url = "http://127.0.0.1:8000/api/equipment/"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

response = requests.get(url, headers=headers)
print(f"Status: {response.status_code}")
print(f"Data: {response.json()}")
```

## ✅ Next Steps

1. Verify equipment exists in database
2. Test API endpoint directly (Postman/browser)
3. Check backend logs for debug messages
4. Check frontend console for API response
5. Verify dropdown receives and displays data

---

**Note**: RLS is currently open for testing. Remember to implement proper role-based policies before production!


