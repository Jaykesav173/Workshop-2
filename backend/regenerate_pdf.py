import asyncio
import json
import os
from app.database.connection import get_db
from app.routers.report_generation.service_report_generation import ReportGenerationService
from app.database.schemas import API510ReportRequest
from app.config import settings

async def regenerate_pdf():
    print("Starting PDF regeneration...")
    db = get_db()
    report_id = "e7ceede1-d523-465f-a72f-2c4721696ee7"
    
    # 1. Fetch Report
    res = db.table("Report").select("*").eq("report_id", report_id).execute()
    if not res.data:
        print("Report not found!")
        return
        
    report_record = res.data[0]
    content_json = report_record.get("content")
    
    if not content_json:
        print("No content found in report record.")
        return
        
    # 2. Parse Content
    try:
        data = json.loads(content_json)
        # Create Pydantic model
        report_request = API510ReportRequest(**data)
        print("Successfully parsed report data.")
    except Exception as e:
        print(f"Failed to parse report data: {e}")
        return

    # 3. Generate PDF
    service = ReportGenerationService()
    
    # Construct base filename
    # Mimic the logic in service_report_generation.py
    # format: report_<equipment_id>_<timestamp>
    # We can use the existing ID or just make a new recognizable one
    from datetime import datetime
    base_filename = f"regenerated_report_{data.get('equipment_id', 'unknown')}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    
    try:
        print(f"Generating PDF: {base_filename}")
        pdf_path = await service._generate_pdf_report(report_request, base_filename)
        print(f"PDF Generated at: {pdf_path}")
        
        # 4. Update DB
        if os.path.exists(pdf_path):
            update_res = db.table("Report").update({"pdf_path": pdf_path}).eq("report_id", report_id).execute()
            print("Database updated with new PDF path.")
        else:
            print("Error: PDF file does not exist after generation?!")
            
    except Exception as e:
        print(f"Error during PDF generation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(regenerate_pdf())
