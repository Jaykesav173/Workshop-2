
import asyncio
import os
import sys

# Add project root to path
# We need to add the directory containing 'app' package, which is the current directory (backend)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.routers.report_generation.service_report_generation import ReportGenerationService
from app.database.schemas import API510ReportRequest, ReportHeader, PhotoItem, FindingItem, RecommendationItem, ReportResponse

async def test_report_workflow():
    print("\n🚀 Testing Report Status Workflow...")
    
    service = ReportGenerationService()
    
    # 1. Mock Report Data
    headers = ReportHeader(
        plant="TEST PLANT",
        equipment_tag="V-TEST-001",
        equipment_description="Test Vessel",
        report_date="2025-01-01",
        inspector_name="Test Inspector",
        dosh_no="DOSH-123",
        report_no=""
    )
    
    report_req = API510ReportRequest(
        header=headers,
        findings=[],
        recommendations=[],
        photos=[],
        inspection_id=None,
        equipment_id=None
    )
    
    current_user = {"id": 1, "username": "test_inspector", "role": "INSPECTOR"}
    
    # 2. Generate Report
    print("\n1️⃣ Generating Report...")
    try:
        report = await service.generate_report(report_req, current_user)
        print(f"✅ Report Generated. ID: {report.report_id}")
        print(f"   Status: {report.status}")
        
        if report.status != "DRAFT":
            print(f"❌ Error: Initial status should be DRAFT, got {report.status}")
        else:
            print("✅ Initial status is DRAFT")
            
        report_id = report.report_id
        
        # 3. Submit Report
        print("\n2️⃣ Submitting Report...")
        submitted_report = await service.submit_report(report_id, current_user)
        print(f"✅ Report Submitted.")
        print(f"   Status: {submitted_report.status}")
        
        if submitted_report.status.upper() != "SUBMITTED":
             print(f"❌ Error: Status should be SUBMITTED, got {submitted_report.status}")
        else:
             print("✅ Status is SUBMITTED")

        # 4. Review (approving)
        print("\n3️⃣ Reviewing Report (Approve)...")
        # Mock engineer
        engineer_user = {"id": 2, "username": "test_engineer", "role": "ENGINEER"}
        reviewed_report = await service.review_report(report_id, "approve", "Looks good", engineer_user)
        print(f"✅ Report Approved.")
        print(f"   Status: {reviewed_report.status}")
        
        if reviewed_report.status.upper() != "APPROVED":
             print(f"❌ Error: Status should be APPROVED, got {reviewed_report.status}")
        else:
             print("✅ Status is APPROVED")
             
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_report_workflow())
