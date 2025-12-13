# Reports Module Testing Guide

## 🧪 Testing Checklist

### Prerequisites
- ✅ Backend server running on `http://127.0.0.1:8000`
- ✅ Frontend dev server running on `http://localhost:5173`
- ✅ User logged in (authentication token in localStorage)
- ✅ At least one equipment exists in database
- ✅ At least one photo exists for testing equipment

---

## 📋 Test Scenarios

### 1. **Access Reports Page**
- **URL:** `http://localhost:5173/reports`
- **Expected:**
  - Page loads without errors
  - Title: "API-510 Pressure Vessel Inspection Report"
  - Equipment selection dropdown visible
  - All form sections visible (Header, Findings, Recommendations, NDT, Photos)

### 2. **Equipment Selection**
- **Steps:**
  1. Select an equipment from dropdown
  2. Check header fields auto-fill:
     - Equipment tag
     - Equipment description
     - Plant
  3. Check available photos load below
- **Expected:**
  - Header fields populate automatically
  - Photos for selected equipment appear
  - Equipment ID is set

### 3. **Header Fields**
- **Test Fields:**
  - Equipment tag (auto-filled, editable)
  - Equipment description (auto-filled, editable)
  - Plant (auto-filled, editable)
  - DOSH registration no. (manual entry)
  - Report no. (manual entry)
  - Report date (defaults to today, editable)
  - Inspector name (auto-filled from token, editable)
  - Reviewed by (optional, manual entry)
  - Client approver (optional, manual entry)
- **Expected:**
  - All fields are editable
  - Date picker works
  - Inspector name auto-fills from JWT token

### 4. **Findings Management**
- **Test:**
  1. Click "Add Finding"
  2. Enter finding key (e.g., "1.1", "2.3")
  3. Enter finding text
  4. Add multiple findings
  5. Edit a finding
  6. Remove a finding
- **Expected:**
  - Findings list updates correctly
  - Can add/edit/remove findings
  - Finding keys can be any format (e.g., "1.1", "2.3", "7.1")

### 5. **Recommendations Management**
- **Test:**
  1. Click "Add Recommendation"
  2. Enter recommendation key (e.g., "2.2", "2.5")
  3. Enter recommendation text
  4. Add multiple recommendations
  5. Edit a recommendation
  6. Remove a recommendation
- **Expected:**
  - Recommendations list updates correctly
  - Can add/edit/remove recommendations

### 6. **NDT Text**
- **Test:**
  1. Enter text in NDT textarea
  2. Leave empty (should be optional)
- **Expected:**
  - Textarea accepts multi-line text
  - Can be left empty

### 7. **Photo Selection**
- **Test:**
  1. Select equipment with photos
  2. Click "Add Photo to Report" on an available photo
  3. Enter finding key (e.g., "7.1")
  4. Enter finding text
  5. Enter recommendation text
  6. Add multiple photos
  7. Remove a photo from report
- **Expected:**
  - Photos can be added to report
  - Each photo requires finding key, finding text, recommendation text
  - Photos appear in "Report Photos" section
  - Can remove photos from report

### 8. **Report Generation**
- **Prerequisites:**
  - Equipment selected
  - Header fields filled (at minimum: equipment_tag, report_no, report_date, inspector_name)
  - At least one finding added
  - At least one recommendation added
  - At least one photo added to report
- **Steps:**
  1. Fill all required fields
  2. Click "Generate Report" button
  3. Wait for API response
- **Expected:**
  - Loading state shows
  - Success message appears
  - Report ID is displayed
  - "Download PDF" button appears
  - Error handling if validation fails

### 9. **PDF Download**
- **Prerequisites:**
  - Report successfully generated
- **Steps:**
  1. Click "Download PDF" button
  2. Check downloaded file
- **Expected:**
  - PDF file downloads
  - PDF opens correctly
  - PDF contains:
    - Page 1: Header, Findings, Recommendations, NDT, Signatures
    - Pages 2-N: Photo pages (3 photos per page)
    - Correct formatting (fonts, spacing, borders)
    - Red numbered labels on photos

### 10. **Error Handling**
- **Test Cases:**
  - Generate report without equipment selected
  - Generate report without required header fields
  - Generate report without findings
  - Generate report without recommendations
  - Generate report without photos
  - Network error (backend down)
  - Invalid authentication token
- **Expected:**
  - Clear error messages
  - UI doesn't break
  - User can retry

---

## 🔍 API Endpoints to Verify

### Backend Endpoints:
1. `POST /api/reports/generate` - Generate report
2. `GET /api/reports/{report_id}` - Get report by ID
3. `GET /api/reports/{report_id}/export-pdf` - Download PDF
4. `GET /api/reports/equipment/{equipment_id}` - Get equipment reports
5. `GET /api/equipment/` - Get equipment list
6. `GET /api/photos/equipment/{equipment_id}` - Get equipment photos

---

## 📊 Data Structure Test

### Expected Request Payload:
```json
{
  "equipment_id": 1,
  "header": {
    "equipment_tag": "V-101",
    "equipment_description": "Pressure Vessel",
    "plant": "Plant A",
    "dosh_no": "DOSH-12345",
    "report_no": "RPT-2024-001",
    "report_date": "2024-01-15",
    "inspector_name": "John Doe",
    "reviewed_by": "Jane Smith",
    "client_approver": "Client Name"
  },
  "findings": [
    {
      "key": "1.1",
      "text": "Equipment fully painted and in good condition"
    },
    {
      "key": "2.1",
      "text": "Internal inspection reveals no defects"
    }
  ],
  "recommendations": [
    {
      "key": "2.2",
      "text": "To be monitored next opportunity"
    }
  ],
  "photos": [
    {
      "finding_key": "7.1",
      "finding_text": "Top dish head found in satisfactory condition",
      "recommendation_text": "Nil.",
      "file_path": "/path/to/photo.jpg",
      "photo_id": 1
    }
  ],
  "ndt_text": "Ultrasonic testing performed. No defects detected.",
  "initial_inspection_text": "Not applicable"
}
```

---

## 🐛 Common Issues to Check

1. **CORS Errors**
   - Check backend CORS settings
   - Verify API_BASE URL is correct

2. **Authentication Errors**
   - Token expired or invalid
   - Check localStorage for token
   - Re-login if needed

3. **Photo Loading**
   - Photos not displaying
   - Check photo file paths
   - Verify photo API endpoint

4. **PDF Generation**
   - PDF not generating
   - Check backend logs
   - Verify reportlab is installed
   - Check file permissions

5. **Form Validation**
   - Required fields not validated
   - Check frontend validation logic

---

## ✅ Success Criteria

All tests pass when:
- ✅ Reports page loads correctly
- ✅ Equipment selection works
- ✅ Header fields auto-fill and are editable
- ✅ Findings can be added/edited/removed
- ✅ Recommendations can be added/edited/removed
- ✅ Photos can be added to report
- ✅ Report generates successfully
- ✅ PDF downloads and opens correctly
- ✅ PDF format matches API-510 requirements
- ✅ Error handling works correctly

---

## 📝 Test Data Setup

### Create Test Equipment:
```sql
INSERT INTO equipment (name, type, location, created_at) 
VALUES ('V-101', 'Pressure Vessel', 'Plant A', NOW());
```

### Create Test Photo:
1. Upload photo via Photo Upload module
2. Associate with equipment

### Create Test User (if needed):
Use authentication endpoint to create inspector user.

---

## 🚀 Quick Test Script

1. **Start Backend:**
   ```bash
   cd VISOR/backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd VISOR/frontend
   npm run dev
   ```

3. **Test Flow:**
   - Login at `http://localhost:5173/login`
   - Navigate to `http://localhost:5173/reports`
   - Select equipment
   - Fill header fields
   - Add findings
   - Add recommendations
   - Add photos
   - Generate report
   - Download PDF

---

**Last Updated:** Current session
**Status:** Ready for testing



