"""
Report Generation Service - Abdalla (Intelligent Report Generation)
Business logic for generating API 510-compliant reports with exact PDF formatting
Matches the exact layout from sample reports

VERSION: 2025-01-15 (Latest Update)
"""
import uuid
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import ReportResponse, API510ReportRequest
from app.config import settings
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image, KeepTogether, Frame, PageTemplate, BaseDocTemplate, Flowable, NextPageTemplate
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.platypus.frames import Frame
from reportlab.platypus.flowables import Image as FlowableImage
import os
import json
import requests
from collections import defaultdict
import io

# Try to import PIL/Pillow, fallback if not available
try:
    from PIL import Image as PILImage, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("Warning: PIL/Pillow not available. Photo labels will not be overlaid.")

class FixedSizeImage(Flowable):
    """
    Custom Flowable that draws an image with fixed dimensions.
    CRITICAL: This class NEVER calls .draw() on an Image object.
    Instead, it uses self.canv.drawImage() directly to avoid AttributeError.
    """
    def __init__(self, image_path, width, height):
        """
        Initialize FixedSizeImage flowable.
        
        Args:
            image_path: Path to the image file (string)
            width: Target width in points (float)
            height: Target height in points (float)
        """
        Flowable.__init__(self)
        self.image_path = str(image_path)
        self.width = float(width)
        self.height = float(height)
        
        # Validate dimensions
        if self.width <= 0 or self.height <= 0:
            raise ValueError(f"Invalid image dimensions: {self.width}x{self.height}")
        if self.width > 10000 or self.height > 10000:
            raise ValueError(f"Image dimensions too large: {self.width}x{self.height}")
        
        # Validate file exists
        if not os.path.exists(self.image_path):
            raise FileNotFoundError(f"Image file not found: {self.image_path}")
    
    def wrap(self, availWidth, availHeight):
        """
        Return the size this flowable takes.
        Always returns the fixed dimensions, ignoring available space.
        
        Args:
            availWidth: Available width (ignored)
            availHeight: Available height (ignored)
        
        Returns:
            Tuple of (width, height) in points
        """
        return self.width, self.height
    
    def draw(self):
        """
        Draw the image using canvas.drawImage() directly.
        CRITICAL: Never calls .draw() on an Image object.
        Uses self.canv.drawImage() which is the correct way to draw images in ReportLab.
        """
        # CRITICAL: Use self.canv.drawImage() directly
        # Never call .draw() on an Image object - it doesn't have a canvas assigned
        # The canvas is only available in draw() via self.canv
        
        try:
            # Draw image at (0, 0) with fixed dimensions
            # anchor='sw' means anchor at southwest (bottom-left)
            # preserveAspectRatio=True ensures aspect ratio is maintained
            self.canv.drawImage(
                self.image_path,           # Image file path
                0,                         # X position (left edge)
                0,                         # Y position (bottom edge)
                width=self.width,          # Fixed width in points
                height=self.height,        # Fixed height in points
                preserveAspectRatio=True,  # Maintain aspect ratio
                anchor='sw'                # Anchor at southwest (bottom-left)
            )
        except Exception as e:
            # If drawing fails, log error but don't crash
            print(f"❌ Error drawing image {self.image_path}: {e}")
            import traceback
            traceback.print_exc()
            # Draw a placeholder rectangle
            self.canv.rect(0, 0, self.width, self.height, fill=0, stroke=1)
            self.canv.setFont("Helvetica", 8)
            self.canv.drawString(5, 5, f"Image Error: {os.path.basename(self.image_path)}")

def map_inspection_type_to_code(inspection_type: str) -> str:
    """
    Map inspection type to standardized code for report number.
    
    VISUAL -> VI
    NDT -> NDT (or keep as is)
    COMPREHENSIVE -> COMP (or keep as is)
    ROUTINE -> ROUT (or keep as is)
    
    If already a code (like "VI"), return as-is.
    """
    if not inspection_type:
        return "VI"
    
    inspection_type_upper = inspection_type.upper().strip()
    
    # Mapping dictionary
    type_mapping = {
        "VISUAL": "VI",
        "VISUAL INSPECTION": "VI",
        "NDT": "NDT",
        "NDT INSPECTION": "NDT",
        "COMPREHENSIVE": "COMP",
        "ROUTINE": "ROUT",
    }
    
    # Check if it's already a code or if we have a mapping
    if inspection_type_upper in type_mapping:
        return type_mapping[inspection_type_upper]
    
    # If it's already a short code (like "VI", "NDT"), return as-is
    if len(inspection_type_upper) <= 4:
        return inspection_type_upper
    
    # Default to VI for unknown types
    return "VI"


def generate_report_number(
    plant: str,
    equipment_tag: str,
    report_date: str,
    inspection_type: str = "VI",
    turnaround_code: str = None
) -> str:
    """
    Generate report number according to format:
    <PLANT>/<INSPECTION_TYPE>/<EQUIPMENT_TAG>/<TURNAROUND_CODE>
    
    Example: PLANT1/VI/V-002/TA2025
    
    Rules:
    - PLANT: From inspection.plant_unit_area (remove spaces, uppercase)
    - INSPECTION_TYPE: Mapped to code (VISUAL -> VI)
    - EQUIPMENT_TAG: Equipment tag number
    - TURNAROUND_CODE: TA<YYYY> from report_date
    """
    if not plant or not equipment_tag or not report_date:
        raise ValueError("Plant, equipment_tag, and report_date are required for report number generation")
    
    # Normalize plant name: remove spaces, convert to uppercase
    plant_normalized = plant.replace(" ", "").upper()
    
    # Map inspection type to standardized code
    inspection_type_code = map_inspection_type_to_code(inspection_type)
    
    # Extract year from report_date and create turnaround code
    if turnaround_code:
        turnaround_code_normalized = turnaround_code.upper()
    else:
        # Try to extract year from report_date
        try:
            from datetime import datetime
            # Handle different date formats
            if isinstance(report_date, str):
                # Try ISO format first (YYYY-MM-DD)
                if len(report_date) >= 4:
                    year = report_date[:4]
                    if year.isdigit():
                        turnaround_code_normalized = f"TA{year}"
                    else:
                        # Try parsing as date
                        try:
                            date_obj = datetime.strptime(report_date, "%Y-%m-%d")
                            turnaround_code_normalized = f"TA{date_obj.year}"
                        except:
                            # Try other formats
                            try:
                                date_obj = datetime.strptime(report_date, "%d/%m/%Y")
                                turnaround_code_normalized = f"TA{date_obj.year}"
                            except:
                                # Fallback to current year
                                turnaround_code_normalized = f"TA{datetime.now().year}"
                else:
                    turnaround_code_normalized = f"TA{datetime.now().year}"
            else:
                turnaround_code_normalized = f"TA{datetime.now().year}"
        except Exception as e:
            # Fallback to current year
            from datetime import datetime
            turnaround_code_normalized = f"TA{datetime.now().year}"
    
    # Construct report number: <PLANT>/<INSPECTION_TYPE>/<EQUIPMENT_TAG>/<TURNAROUND_CODE>
    report_no = f"{plant_normalized}/{inspection_type_code}/{equipment_tag}/{turnaround_code_normalized}"
    
    return report_no


class ReportGenerationService:
    def __init__(self):
        self.db = get_db()
        os.makedirs(settings.REPORTS_DIR, exist_ok=True)
        # A4 dimensions in points (1 inch = 72 points)
        self.page_width = A4[0]
        self.page_height = A4[1]
        self.margin = 15 * mm  # 15mm margins
        self.content_width = self.page_width - (2 * self.margin)
        self.content_height = self.page_height - (2 * self.margin)  # Full content height
    
    async def generate_report(
        self, 
        report_data: API510ReportRequest,
        current_user: dict = None
    ) -> ReportResponse:
        """
        Generate API 510-compliant inspection report with exact PDF formatting
        """
        try:
            print(f"\n🔍 GENERATE REPORT DEBUG:")
            print(f"   Equipment ID: {report_data.equipment_id}")
            print(f"   Inspection ID: {report_data.inspection_id}")
            print(f"   Report Number: {report_data.header.report_no}")
            print(f"   Photos count: {len(report_data.photos) if report_data.photos else 0}")
            print(f"   Findings count: {len(report_data.findings) if report_data.findings else 0}")
            print(f"   Recommendations count: {len(report_data.recommendations) if report_data.recommendations else 0}")
            
            # Get inspection data if provided - CRITICAL: Use inspection's plant_unit_area
            inspection_data = None
            if report_data.inspection_id:
                try:
                    inspection_res = self.db.table("Inspection").select("*").eq("inspection_id", report_data.inspection_id).execute()
                    if inspection_res.data:
                        inspection_data = inspection_res.data[0]
                        print(f"   ✅ Fetched inspection data: plant_unit_area={inspection_data.get('plant_unit_area')}, inspection_type={inspection_data.get('inspection_type')}")
                        # Override header plant with inspection's plant_unit_area if available
                        if inspection_data.get('plant_unit_area'):
                            report_data.header.plant = inspection_data.get('plant_unit_area')
                            print(f"   ✅ Updated header.plant from inspection: {report_data.header.plant}")
                        # Override inspection_type if available from inspection
                        if inspection_data.get('inspection_type'):
                            mapped_type = map_inspection_type_to_code(inspection_data.get('inspection_type'))
                            report_data.header.inspection_type = mapped_type
                            print(f"   ✅ Updated header.inspection_type from inspection: {mapped_type}")
                except Exception as e:
                    print(f"   ⚠️ Error fetching inspection data: {e}")
            
            # Auto-generate report number if not provided or empty
            # CRITICAL: Ensure plant comes from inspection.plant_unit_area (already set above if inspection exists)
            if not report_data.header.report_no or report_data.header.report_no.strip() == "":
                # Get inspection type code (use mapped value from header if available, otherwise default to VI)
                inspection_type_code = getattr(report_data.header, 'inspection_type', 'VI')
                if inspection_data and inspection_data.get('inspection_type'):
                    inspection_type_code = map_inspection_type_to_code(inspection_data.get('inspection_type'))
                
                report_data.header.report_no = generate_report_number(
                    plant=report_data.header.plant,
                    equipment_tag=report_data.header.equipment_tag,
                    report_date=report_data.header.report_date,
                    inspection_type=inspection_type_code,
                    turnaround_code=getattr(report_data.header, 'turnaround_code', None)
                )
                print(f"📋 Auto-generated report number: {report_data.header.report_no}")
                print(f"   Using plant: {report_data.header.plant}, inspection_type: {inspection_type_code}")
            
            # Get equipment data if provided
            equipment_data = None
            if report_data.equipment_id:
                equipment_res = self.db.table("equipment").select("*").eq("id", report_data.equipment_id).execute()
                if equipment_res.data:
                    equipment_data = equipment_res.data[0]
            
            # Generate report filename
            report_filename = f"report_{report_data.equipment_id or 'general'}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            # Save JSON data
            json_path = os.path.join(settings.REPORTS_DIR, f"{report_filename}.json")
            with open(json_path, "w") as f:
                json.dump(report_data.model_dump(), f, indent=2)
            
            # Generate PDF with exact formatting
            print(f"   Generating PDF...")
            pdf_path = await self._generate_pdf_report(report_data, report_filename)
            print(f"   PDF generated: {pdf_path}")
            
            # Generate report_id - CRITICAL: Must be a valid UUID string
            generated_report_id = str(uuid.uuid4())
            print(f"📋 Generated report_id: {generated_report_id}")
            
            # Save to database
            # Safely get inspection_id from Pydantic model
            # Use model_dump() to get all fields, then access inspection_id safely
            report_data_dict = report_data.model_dump()
            inspection_id_value = report_data_dict.get('inspection_id', None)
            if inspection_id_value is not None:
                inspection_id_value = int(inspection_id_value)  # Ensure it's an integer
            
            print(f"📋 Inspection ID from request: {inspection_id_value}")
            
            report_record = {
                "report_id": generated_report_id,  # UUID string for report_id column
                "inspection_id": inspection_id_value,  # Can be None if not provided
                "equipment_id": report_data_dict.get('equipment_id'),
                "created_by": current_user.get("id") if current_user else None,
                "report_path": json_path,
                "report_url": None,
                "pdf_path": pdf_path,
                "pdf_url": None,
                "report_type": "API_510",
                "title": f"API 510 Inspection Report - {report_data.header.equipment_tag}",
                "content": json.dumps(report_data.model_dump(), indent=2),
                "api_510_compliant": True,  # Boolean, not string
                "inspection_date": report_data.header.report_date,
                "next_inspection_due": None,
                "labeled_photos": json.dumps([{"finding_key": p.finding_key, "storage_url": p.storage_url} for p in report_data.photos]) if report_data.photos else json.dumps([]),
                "labeled_defects": json.dumps([]),
                "inspection_frequency": None,
                "defect_types_summary": json.dumps({}),
                "status": "DRAFT",
                "created_at": str(datetime.utcnow())
            }
            
            # Debug: Log the report_record before insert
            print(f"📋 Report record keys: {list(report_record.keys())}")
            print(f"📋 Report record report_id value: {report_record.get('report_id')}")
            print(f"📋 Report record report_id type: {type(report_record.get('report_id'))}")
            print(f"📋 Report record inspection_id: {report_record.get('inspection_id')}")
            
            res = self.db.table("Report").insert(report_record).execute()
            
            if res.data:
                # Map database response to Pydantic schema
                db_record = res.data[0]
                
                # Ensure api_510_compliant is boolean (database stores as boolean)
                api_510_value = db_record.get('api_510_compliant')
                if api_510_value is None:
                    api_510_value = False
                elif isinstance(api_510_value, str):
                    # Convert string to boolean if needed
                    api_510_value = api_510_value.lower() in ('true', 'yes', '1')
                
                # Extract report_no from content JSON if available
                report_no = None
                try:
                    if db_record.get('content'):
                        content_data = json.loads(db_record.get('content'))
                        if isinstance(content_data, dict) and 'header' in content_data:
                            report_no = content_data['header'].get('report_no')
                            print(f"📋 Extracted report_no from content: {report_no}")
                except Exception as e:
                    print(f"⚠️ Error extracting report_no from content: {e}")
                
                # Database already has report_id (UUID string) - use it directly
                response_data = {
                    **db_record,
                    'api_510_compliant': bool(api_510_value),  # Ensure it's a boolean
                    'report_no': report_no,  # Add extracted report_no
                }
                
                return ReportResponse(**response_data)
            else:
                raise HTTPException(status_code=400, detail="Failed to generate report")
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"\n❌ ERROR GENERATING REPORT:")
            print(error_trace)
            raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
    
    async def _generate_pdf_report(self, report_data: API510ReportRequest, base_filename: str) -> str:
        """
        Generate PDF report matching EXACT API-510 format from reference images
        Structure (CORRECT ORDER):
        1. HEADER PAGE with proper 2-column table
        2. EQUIPMENT INFORMATION table
        3. FINDINGS, NDTs & RECOMMENDATIONS PAGE with bordered box
        4. PHOTOS REPORT PAGES (multi-page)
        5. SIGNATURE/APPROVAL SECTION (5-row table)
        """
        pdf_filename = f"{base_filename}.pdf"
        pdf_path = os.path.join(settings.REPORTS_DIR, pdf_filename)
        
        # Format footer date once (for use in page templates)
        footer_date = report_data.header.report_date or ''
        try:
            if footer_date:
                from datetime import datetime
                try:
                    dt = datetime.fromisoformat(footer_date.replace('Z', '+00:00'))
                    footer_date = dt.strftime('%d %B %Y')
                except:
                    try:
                        dt = datetime.strptime(footer_date, '%Y-%m-%d')
                        footer_date = dt.strftime('%d %B %Y')
                    except:
                        pass
        except:
            pass
        
        # Store footer data as instance variables for use in page templates
        footer_inspector = report_data.header.inspector_name or ''
        
        # Create PDF document with standard margins
        # Use BaseDocTemplate to support custom page templates with footers
        doc = BaseDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm
        )
        
        # Calculate content width for tables
        self.content_width = doc.width
        
        # Create frame for standard pages (no footer)
        standard_frame = Frame(
            doc.leftMargin,
            doc.bottomMargin,
            doc.width,
            doc.height,
            id='standard'
        )
        
        # Create frame for photo pages (with space reserved for footer at bottom)
        footer_height = 35  # Space reserved for footer in points
        photo_frame = Frame(
            doc.leftMargin,
            doc.bottomMargin + footer_height,  # Reserve space for footer
            doc.width,
            doc.height - footer_height,  # Reduce available height
            id='photo'
        )
        
        # Track if this is the first page (for border drawing)
        self.is_first_page = True
        
        # Page template for standard pages (with border on first page)
        def on_standard_page(canvas, doc):
            # Draw full-page border on first page only
            if self.is_first_page:
                canvas.setStrokeColor(colors.black)
                canvas.setLineWidth(1)
                # Draw border around content area (inside margins)
                canvas.rect(
                    doc.leftMargin,
                    doc.bottomMargin,
                    doc.width,
                    doc.height,
                    fill=0,
                    stroke=1
                )
                self.is_first_page = False
        
        standard_template = PageTemplate(
            id='standard',
            frames=[standard_frame],
            onPage=on_standard_page
        )
        
        # Store report_data for use in page template callbacks
        self._report_data_for_template = report_data
        
        # Page template for photo pages (with footer at bottom)
        def on_photo_page(canvas, doc):
            """Draw footer at bottom of photo pages - called for EVERY photo page"""
            # Footer table data - single row with two columns
            footer_data = [[
                f"Inspected by: {footer_inspector}",
                f"Date: {footer_date}"
            ]]
            
            # Create footer table
            footer_table = Table(footer_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
            footer_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),      # Left cell - left aligned
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),     # Right cell - right aligned
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Border around table
            ]))
            
            # Draw footer at bottom of page (just above bottom margin)
            footer_table.wrapOn(canvas, doc.width, footer_height)
            footer_table.drawOn(canvas, doc.leftMargin, doc.bottomMargin)
        
        photo_template = PageTemplate(
            id='photo',
            frames=[photo_frame],
            onPage=on_photo_page
        )
        
        # Add templates to document (standard first, photo second)
        doc.addPageTemplates([standard_template, photo_template])
        
        # Container for the 'Flowable' objects
        story = []
        
        # Define styles
        styles = getSampleStyleSheet()
        
        # ============================================
        # PART 1: HEADER SECTION - EXACT TEMPLATE MATCH
        # ============================================
        
        # Format report date properly
        report_date = report_data.header.report_date or ''
        try:
            # Try to parse and format date
            if report_date:
                from datetime import datetime
                try:
                    # Try ISO format first
                    dt = datetime.fromisoformat(report_date.replace('Z', '+00:00'))
                    report_date = dt.strftime('%d %B %Y')
                except:
                    # Try other formats
                    try:
                        dt = datetime.strptime(report_date, '%Y-%m-%d')
                        report_date = dt.strftime('%d %B %Y')
                    except:
                        pass
        except:
            pass
        
        # Ensure report number is generated if not present
        if not report_data.header.report_no or report_data.header.report_no.strip() == "":
            report_data.header.report_no = generate_report_number(
                plant=report_data.header.plant,
                equipment_tag=report_data.header.equipment_tag,
                report_date=report_data.header.report_date,
                inspection_type=getattr(report_data.header, 'inspection_type', 'VI'),
                turnaround_code=getattr(report_data.header, 'turnaround_code', None)
            )
            print(f"📋 PDF Generation: Auto-generated report number: {report_data.header.report_no}")
        
        # Calculate exact column widths to match template
        # Left empty box + Title + Right report box = full width
        # Based on template: left box ~20%, title ~50%, right box ~30%
        left_box_width = doc.width * 0.20
        title_width = doc.width * 0.50
        right_box_width = doc.width * 0.30
        
        # Title style - exact match
        title_style = ParagraphStyle(
            'Title',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.black,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            spaceAfter=0,
            spaceBefore=0,
            leading=16
        )
        
        # Report info style - exact match
        report_info_style = ParagraphStyle(
            'ReportInfo',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            spaceAfter=0,
            leading=11
        )
        
        # Create header table with 3 columns: Left empty box, Title, Right report box
        header_table_data = [
            [
                '',  # Left empty alignment box
                Paragraph("MAJOR TURNAROUND 2025<br/>PRESSURE VESSEL INSPECTION REPORT", title_style),
                Paragraph(
                    f"Report no.: {report_data.header.report_no}<br/>"
                    f"Report date.: {report_date}",
                    report_info_style
                )
            ]
        ]
        
        header_table = Table(header_table_data, colWidths=[left_box_width, title_width, right_box_width])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),      # Left empty box
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),   # Title centered
            ('ALIGN', (2, 0), (2, 0), 'LEFT'),     # Report info left-aligned
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (1, 0), (1, 0), 14),
            ('FONTSIZE', (2, 0), (2, 0), 9),
            ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),  # All borders
        ]))
        
        story.append(header_table)
        story.append(Spacer(1, 5*mm))  # Reduced from 6mm to 5mm to save space
        
        # ============================================
        # PART 2: EQUIPMENT INFORMATION - EXACT 4-BOX LAYOUT
        # ============================================
        # Equipment info style with bold labels
        equipment_label_style = ParagraphStyle(
            'EquipmentLabel',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            spaceAfter=0,
            leading=11
        )
        
        equipment_value_style = ParagraphStyle(
            'EquipmentValue',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            spaceAfter=0,
            leading=11
        )
        
        # Create equipment table - SINGLE BOX PER ROW with two columns inside
        # Row 1: Single box divided into two columns
        row1_data = [
            [
                Paragraph(f"<b>Equipment tag no.:</b> {report_data.header.equipment_tag or ''}", equipment_value_style),
                Paragraph(f"<b>Plant/Unit/Area:</b> {report_data.header.plant or ''}", equipment_value_style)
            ]
        ]
        
        row1_table = Table(row1_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
        row1_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),  # Left-aligned, not centered
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Top-aligned
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Outer border + vertical divider
            ('LINEBELOW', (0, 0), (0, 0), 0, colors.white),  # No line below left cell
            ('LINEBELOW', (1, 0), (1, 0), 0, colors.white),  # No line below right cell
        ]))
        
        # Row 2: Single box divided into two columns
        row2_data = [
            [
                Paragraph(f"<b>Equipment description:</b> {report_data.header.equipment_description or ''}", equipment_value_style),
                Paragraph(f"<b>DOSH registration no.:</b> {report_data.header.dosh_no or ''}", equipment_value_style)
            ]
        ]
        
        row2_table = Table(row2_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
        row2_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),  # Left-aligned, not centered
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # Top-aligned
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Outer border + vertical divider
        ]))
        
        # Combine rows with spacing
        equipment_table_elements = [row1_table, Spacer(1, 0), row2_table]
        
        # Add equipment rows
        story.extend(equipment_table_elements)
        story.append(Spacer(1, 6*mm))  # Exact spacing match
        
        # ============================================
        # PART 3: MAIN CONTENT BOX - FINDINGS, NDTS & RECOMMENDATIONS
        # ============================================
        
        # Main title with grey background - EXACT COLOR MATCH #DCDCDC
        main_title_style = ParagraphStyle(
            'MainTitle',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.black,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            backColor=colors.HexColor('#DCDCDC'),  # Exact grey match from template
            spaceAfter=6,
            spaceBefore=0,
            leading=13
        )
        
        # Introduction paragraph style - exact match
        intro_style = ParagraphStyle(
            'Intro',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,  # Left aligned to match template
            fontName='Helvetica',
            spaceAfter=4,
            leading=11,
            leftIndent=0  # No indentation
        )
        
        # Section header style (bold, underlined) - reduced spacing
        section_header_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            spaceAfter=2,  # Reduced from 3 to 2
            spaceBefore=2,  # Reduced from 4 to 2
            leading=12
        )
        
        # Finding item style - reduced spacing
        finding_item_style = ParagraphStyle(
            'FindingItem',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            leftIndent=6*mm,  # Indentation for numbered items
            spaceAfter=1,  # Reduced from 2 to 1
            leading=11
        )
        
        # Title with grey background in a bordered table - EXACT MATCH
        title_table = Table([[Paragraph("FINDINGS, NDTS & RECOMMENDATIONS", main_title_style)]], colWidths=[doc.width])
        title_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 7),  # Reduced from 8 to 7 to save space
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),  # Reduced from 8 to 7 to save space
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Borders - exact match
        ]))
        story.append(title_table)
        story.append(Spacer(1, 3*mm))  # Reduced from 4mm to 3mm to save space
        
        # Introduction paragraph - exact text and formatting from template
        # Based on template: "Condition: With respect to the internal surface, describe and state location..."
        intro_text = (
            "Condition: With respect to the internal surface, describe and state location of any corrosion "
            "and state whether active or inactive. State location and extent of any erosion, grooving, "
            "bulging, warping, cracking or similar condition. Report on any defective rivets bowed, loose "
            "or broken stays. State condition of all tubes, tube end, coils, major changes or repairs made "
            "since last inspection."
        )
        story.append(Paragraph(intro_text, intro_style))
        story.append(Spacer(1, 3*mm))  # Reduced from 4mm to 3mm to save space
        
        # FINDINGS Section
        story.append(Paragraph("<u>FINDINGS</u>", section_header_style))
        story.append(Spacer(1, 1*mm))  # Reduced from 1.5mm to 1mm to save space
        
        # Initial/Pre-Inspection
        story.append(Paragraph(
            f"Initial/Pre-Inspection - {report_data.initial_inspection_text or 'Not applicable'}",
            finding_item_style
        ))
        story.append(Spacer(1, 1.5*mm))  # Reduced from 2mm to 1.5mm to save space
        
        # Post/Final Inspection
        story.append(Paragraph("Post/Final Inspection", section_header_style))
        story.append(Spacer(1, 1*mm))  # Reduced from 1.5mm to 1mm to save space
        
        # External Findings (1.x) - ALWAYS show this section
        story.append(Paragraph("<u>External</u>", section_header_style))
        external_findings = sorted([f for f in report_data.findings if f.key.startswith('1.')], 
                                   key=lambda x: (int(x.key.split('.')[0]), int(x.key.split('.')[1]) if '.' in x.key and len(x.key.split('.')) > 1 else 0))
        if external_findings:
            for finding in external_findings:
                story.append(Paragraph(f"{finding.key}: {finding.text}", finding_item_style))
        else:
            # Show placeholder if no external findings
            story.append(Paragraph("No external findings recorded.", finding_item_style))
        story.append(Spacer(1, 1.5*mm))  # Reduced from 2mm to 1.5mm to save space
        
        # Internal Findings (2.x) - ALWAYS show this section
        story.append(Paragraph("<u>Internal</u>", section_header_style))
        internal_findings = sorted([f for f in report_data.findings if f.key.startswith('2.')],
                                   key=lambda x: (int(x.key.split('.')[0]), int(x.key.split('.')[1]) if '.' in x.key and len(x.key.split('.')) > 1 else 0))
        if internal_findings:
            for finding in internal_findings:
                story.append(Paragraph(f"{finding.key}: {finding.text}", finding_item_style))
        else:
            # Show placeholder if no internal findings
            story.append(Paragraph("No internal findings recorded.", finding_item_style))
        story.append(Spacer(1, 1.5*mm))  # Reduced from 2mm to 1.5mm to save space
        
        # Other Findings (not 1.x or 2.x)
        other_findings = sorted([f for f in report_data.findings if not f.key.startswith('1.') and not f.key.startswith('2.')],
                               key=lambda x: (int(x.key.split('.')[0]) if '.' in x.key else 999, int(x.key.split('.')[1]) if '.' in x.key and len(x.key.split('.')) > 1 else 0))
        if other_findings:
            for finding in other_findings:
                story.append(Paragraph(f"{finding.key}: {finding.text}", finding_item_style))
            story.append(Spacer(1, 1.5*mm))  # Reduced from 2mm to 1.5mm to save space
        
        # NON-DESTRUCTIVE TESTINGS Section - ALWAYS show
        story.append(Paragraph("<u>NON-DESTRUCTIVE TESTINGS</u>", section_header_style))
        if report_data.ndt_text:
            story.append(Paragraph(f"UTTM: {report_data.ndt_text}", finding_item_style))
        else:
            story.append(Paragraph("UTTM: No significant wall lost detected compared to nominal thickness. Please refer attachment report.", finding_item_style))
        story.append(Spacer(1, 1.5*mm))  # Reduced from 2mm to 1.5mm to save space
        
        # RECOMMENDATIONS Section - ALWAYS show (on same page)
        story.append(Paragraph("<u>RECOMMENDATIONS</u>", section_header_style))
        if report_data.recommendations and len(report_data.recommendations) > 0:
            sorted_recs = sorted(report_data.recommendations,
                               key=lambda x: (int(x.key.split('.')[0]) if '.' in x.key else 999, int(x.key.split('.')[1]) if '.' in x.key and len(x.key.split('.')) > 1 else 0))
            for rec in sorted_recs:
                story.append(Paragraph(f"{rec.key}: {rec.text}", finding_item_style))
        else:
            # Show placeholder if no recommendations
            story.append(Paragraph("No recommendations recorded.", finding_item_style))
        
        story.append(Spacer(1, 3*mm))  # Reduced from 4mm to 3mm - Space before signature section
        
        # ============================================
        # PART 4: SIGNATURE/APPROVAL SECTION - 5-Row Table (on first page)
        # ============================================
        
        signature_label_style = ParagraphStyle(
            'SignatureLabel',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            spaceAfter=0,
            leading=11
        )
        
        signature_value_style = ParagraphStyle(
            'SignatureValue',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            spaceAfter=0,
            leading=11
        )
        
        signature_section_style = ParagraphStyle(
            'SignatureSection',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            spaceAfter=2,
            leading=11
        )
        
        # Create 5-row signature table with proper structure
        col_width = doc.width / 3
        
        # Row 1: Three columns - Inspected by, Reviewed by, Approved by
        # Each cell contains label and value on separate lines
        row1 = [
            Paragraph(f"Inspected by:<br/>{report_data.header.inspector_name or ''}", signature_label_style),
            Paragraph(f"Reviewed by:<br/>{report_data.header.reviewed_by or ''}", signature_label_style),
            Paragraph(f"Approved by (Client):<br/>{report_data.header.client_approver or ''}", signature_label_style)
        ]
        
        # Row 2: Full width - DOSH Officer section - SINGLE BOX with horizontal Name/Signature/Date row
        # Simple structure: Title + Comment space + Name/Signature/Date (all in one box)
        dosh_col_width = (doc.width - 12) / 3  # Equal width for 3 columns
        
        # Create simple table with all content
        dosh_table_data = [
            [Paragraph("Recommendation/Comment by DOSH Officer (if applicable):", signature_section_style)],  # Title
            [Paragraph("", signature_label_style)],  # Empty space for comments (reduced height)
            [  # Name/Signature/Date in one horizontal row
                Paragraph("Name:", signature_label_style),
                Paragraph("Signature:", signature_label_style),
                Paragraph("Date:", signature_label_style)
            ]
        ]
        
        # Create table - use 3 equal columns (will span for title/comment rows)
        dosh_table = Table(dosh_table_data, colWidths=[dosh_col_width, dosh_col_width, dosh_col_width])
        dosh_table.setStyle(TableStyle([
            # Row 1: Title - span all 3 columns
            ('SPAN', (0, 0), (2, 0)),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('VALIGN', (0, 0), (0, 0), 'TOP'),
            ('TOPPADDING', (0, 0), (0, 0), 0),
            ('BOTTOMPADDING', (0, 0), (0, 0), 3),  # Reduced from 4 to 3 to save space
            # Row 2: Empty space - span all 3 columns (reduced to single row)
            ('SPAN', (0, 1), (2, 1)),
            ('TOPPADDING', (0, 1), (0, 1), 0),
            ('BOTTOMPADDING', (0, 1), (0, 1), 0),
            # Row 3: Name/Signature/Date - 3 separate columns, all inside box (was row 4, now row 3)
            ('ALIGN', (0, 2), (0, 2), 'LEFT'),      # Name - left
            ('ALIGN', (1, 2), (1, 2), 'CENTER'),   # Signature - center
            ('ALIGN', (2, 2), (2, 2), 'RIGHT'),    # Date - right
            ('VALIGN', (0, 2), (2, 2), 'MIDDLE'),
            ('TOPPADDING', (0, 2), (2, 2), 3),  # Reduced from 4 to 3 to save space
            ('BOTTOMPADDING', (0, 2), (2, 2), 0),
            # Common styles
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        # Outer table with border - SINGLE BOX containing everything
        row2_content = Table([[dosh_table]], colWidths=[doc.width])
        row2_content.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),  # Reduced from 6 to 5 to save space
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),  # Reduced from 6 to 5 to save space
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Single box border
        ]))
        
        # Row 3: REMOVED - Name/Signature/Date are now inside row2_content
        
        # Row 4: Full width - Plant action section - SINGLE BOX with horizontal Name/Signature/Date row
        # Simple structure: Title + Comment space + Name/Signature/Date (all in one box)
        plant_col_width = (doc.width - 12) / 3  # Equal width for 3 columns
        
        # Create simple table with all content
        plant_table_data = [
            [Paragraph("Action taken by Plant 1 on recommendation by DOSH (if applicable):", signature_section_style)],  # Title
            [Paragraph("", signature_label_style)],  # Empty space for comments (reduced height)
            [  # Name/Signature/Date in one horizontal row
                Paragraph("Name:", signature_label_style),
                Paragraph("Signature:", signature_label_style),
                Paragraph("Date:", signature_label_style)
            ]
        ]
        
        # Create table - use 3 equal columns (will span for title/comment rows)
        plant_table = Table(plant_table_data, colWidths=[plant_col_width, plant_col_width, plant_col_width])
        plant_table.setStyle(TableStyle([
            # Row 1: Title - span all 3 columns
            ('SPAN', (0, 0), (2, 0)),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('VALIGN', (0, 0), (0, 0), 'TOP'),
            ('TOPPADDING', (0, 0), (0, 0), 0),
            ('BOTTOMPADDING', (0, 0), (0, 0), 3),  # Reduced from 4 to 3 to save space
            # Row 2: Empty space - span all 3 columns (reduced to single row)
            ('SPAN', (0, 1), (2, 1)),
            ('TOPPADDING', (0, 1), (0, 1), 0),
            ('BOTTOMPADDING', (0, 1), (0, 1), 0),
            # Row 3: Name/Signature/Date - 3 separate columns, all inside box (was row 4, now row 3)
            ('ALIGN', (0, 2), (0, 2), 'LEFT'),      # Name - left
            ('ALIGN', (1, 2), (1, 2), 'CENTER'),   # Signature - center
            ('ALIGN', (2, 2), (2, 2), 'RIGHT'),    # Date - right
            ('VALIGN', (0, 2), (2, 2), 'MIDDLE'),
            ('TOPPADDING', (0, 2), (2, 2), 3),  # Reduced from 4 to 3 to save space
            ('BOTTOMPADDING', (0, 2), (2, 2), 0),
            # Common styles
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        
        # Outer table with border - SINGLE BOX containing everything
        row4_content = Table([[plant_table]], colWidths=[doc.width])
        row4_content.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 5),  # Reduced from 6 to 5 to save space
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),  # Reduced from 6 to 5 to save space
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Single box border
        ]))
        
        # Row 5: REMOVED - Name/Signature/Date are now inside row4_content
        
        # Build signature table - use separate tables for rows 2 and 4, and a 3-column table for rows 1, 3, 5
        # Wrap entire signature section in KeepTogether to ensure it never splits across pages
        signature_section_elements = []
        
        # First, add row 1 table
        row1_table = Table([row1], colWidths=[col_width, col_width, col_width])
        row1_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TOPPADDING', (0, 0), (-1, -1), 6),  # Reduced from 8 to 6
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),  # Reduced from 8 to 6
            ('LEFTPADDING', (0, 0), (-1, -1), 6),  # Reduced from 8 to 6
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),  # Reduced from 8 to 6
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        signature_section_elements.append(row1_table)
        signature_section_elements.append(Spacer(1, 1.5*mm))  # Reduced to save space
        
        # Add row 2 (full width - DOSH section with all fields inside)
        signature_section_elements.append(row2_content)
        signature_section_elements.append(Spacer(1, 1.5*mm))  # Reduced to save space
        
        # Add row 4 (full width - Plant section with all fields inside)
        signature_section_elements.append(row4_content)
        
        # Wrap entire signature section in KeepTogether to ensure it never splits
        story.append(KeepTogether(signature_section_elements))
        
        # Only add page break if there are photos to show
        if report_data.photos and len(report_data.photos) > 0:
            # Switch to photo page template BEFORE page break so first photo page uses it
            story.append(NextPageTemplate('photo'))
            story.append(PageBreak())  # Break before photos section
        
        
        # ============================================
        # PART 3: PHOTOS REPORT SECTION (Multi-page) - API-510 Standard Format
        # ============================================
        
        # Helper function to create photo page header table (appears on every photo page)
        def create_photo_page_header(report_data):
            """Create the complete header table for photo pages"""
            # Format report date
            report_date = report_data.header.report_date or ''
            try:
                if report_date:
                    from datetime import datetime
                    try:
                        dt = datetime.fromisoformat(report_date.replace('Z', '+00:00'))
                        report_date = dt.strftime('%d %B %Y')
                    except:
                        try:
                            dt = datetime.strptime(report_date, '%Y-%m-%d')
                            report_date = dt.strftime('%d %B %Y')
                        except:
                            pass
            except:
                pass
            
            # Title style
            title_style = ParagraphStyle(
                'PhotoPageTitle',
                parent=styles['Normal'],
                fontSize=14,
                textColor=colors.black,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold',
                spaceAfter=0,
                spaceBefore=0,
                leading=16
            )
            
            # Report info style
            report_info_style = ParagraphStyle(
                'PhotoPageReportInfo',
                parent=styles['Normal'],
                fontSize=9,
                textColor=colors.black,
                alignment=TA_LEFT,
                fontName='Helvetica',
                spaceAfter=2,
                leading=11
            )
            
            # Equipment info style
            equipment_info_style = ParagraphStyle(
                'PhotoPageEquipmentInfo',
                parent=styles['Normal'],
                fontSize=9,
                textColor=colors.black,
                alignment=TA_LEFT,
                fontName='Helvetica',
                spaceAfter=0,
                leading=11
            )
            
            # Header table - same as first page
            header_table_data = [
                [
                    Paragraph("MAJOR TURNAROUND 2025<br/>PRESSURE VESSEL INSPECTION REPORT", title_style),
                    Paragraph(
                        f"Report no.: {report_data.header.report_no}<br/>"
                        f"Report date.: {report_date}",
                        report_info_style
                    )
                ]
            ]
            
            header_table = Table(header_table_data, colWidths=[doc.width * 0.65, doc.width * 0.35])
            header_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                ('ALIGN', (1, 0), (1, 0), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (0, 0), 14),
                ('FONTSIZE', (1, 0), (1, 0), 9),
                ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            # Equipment info table
            equipment_table_data = [
                [
                    Paragraph(f"Equipment tag no.: {report_data.header.equipment_tag or ''}", equipment_info_style),
                    Paragraph(f"Plant/Unit/Area: {report_data.header.plant or ''}", equipment_info_style)
                ],
                [
                    Paragraph(f"Equipment description: {report_data.header.equipment_description or ''}", equipment_info_style),
                    Paragraph(f"DOSH registration no.: {report_data.header.dosh_no or ''}", equipment_info_style)
                ]
            ]
            
            equipment_table = Table(equipment_table_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
            equipment_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            return [header_table, Spacer(1, 2*mm), equipment_table, Spacer(1, 4*mm)]
        
        # Helper function to create "PHOTOS REPORT" grey banner
        def create_photos_report_banner():
            """Create the grey 'PHOTOS REPORT' banner"""
            photos_banner_style = ParagraphStyle(
                'PhotosBanner',
                parent=styles['Normal'],
                fontSize=11,
                textColor=colors.black,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold',
                backColor=colors.HexColor('#E0E0E0'),
                spaceAfter=6,
                spaceBefore=0,
                leading=13
            )
            
            banner_table = Table([[Paragraph("PHOTOS REPORT", photos_banner_style)]], colWidths=[doc.width])
            banner_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            return [banner_table, Spacer(1, 4*mm)]
        
        # Custom flowable to ensure headers appear on new pages
        class PhotoPageHeaderFlowable(Flowable):
            """Flowable that adds header and banner when a new photo page starts"""
            def __init__(self, report_data, create_header_func, create_banner_func):
                Flowable.__init__(self)
                self.report_data = report_data
                self.create_header_func = create_header_func
                self.create_banner_func = create_banner_func
                self.header_added = False
            
            def wrap(self, availWidth, availHeight):
                return (0, 0)  # Takes no space itself
            
            def draw(self):
                # This is called when the flowable is drawn
                # Headers are added to story, not drawn directly
                pass
        
        # Photo header style (black bar with "Photo N")
        photo_header_style = ParagraphStyle(
            'PhotoHeader',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.white,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            backColor=colors.black,
            leftIndent=4,
            rightIndent=4,
            spaceAfter=0,
            spaceBefore=0,
            leading=12
        )
        
        finding_text_style = ParagraphStyle(
            'FindingText',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            spaceAfter=4,
            leading=11
        )
        
        # Group photos by finding key prefix (observation number)
        if not report_data.photos:
            report_data.photos = []
        
        # Process ALL photos, even if they don't have finding_key
        # Sort photos - those with finding_key first, then others
        photos_with_key = [p for p in report_data.photos if getattr(p, 'finding_key', None)]
        photos_without_key = [p for p in report_data.photos if not getattr(p, 'finding_key', None)]
        
        sorted_photos_with_key = sorted(photos_with_key, key=lambda p: (
            int(p.finding_key.split('.')[0]) if p.finding_key and '.' in p.finding_key else 999,
            int(p.finding_key.split('.')[1]) if p.finding_key and '.' in p.finding_key and len(p.finding_key.split('.')) > 1 else 999
        ))
        
        # Combine sorted photos with key and photos without key
        all_sorted_photos = sorted_photos_with_key + photos_without_key
        
        # Group photos by observation number (Photo 1, Photo 2, etc.)
        photo_groups = defaultdict(list)
        photo_group_numbers = {}
        
        for photo in all_sorted_photos:
            # Use finding_key if available, otherwise assign to group 1
            if getattr(photo, 'finding_key', None):
                obs_num = photo.finding_key.split('.')[0] if '.' in photo.finding_key else '1'
            else:
                obs_num = '1'  # Default group for photos without finding_key
            
            if obs_num not in photo_group_numbers:
                photo_group_numbers[obs_num] = len(photo_group_numbers) + 1
            group_key = photo_group_numbers[obs_num]
            photo_groups[group_key].append(photo)
        
        # Generate photo pages with API-510 standard format
        print(f"📸 Processing {len(report_data.photos)} photos for PDF")
        if report_data.photos and len(report_data.photos) > 0:
            # Track if this is the first photo page
            first_photo_page = True
            
            # Track previous group to detect group changes
            previous_group_num = None
            
            for group_num in sorted(photo_groups.keys()):
                group_photos = photo_groups[group_num]
                print(f"📸 Processing photo group {group_num} with {len(group_photos)} photos")
                
                # Add header and banner when starting a new group
                if first_photo_page:
                    # First photo page - add header and banner
                    header_elements = create_photo_page_header(report_data)
                    story.extend(header_elements)
                    
                    # Add "PHOTOS REPORT" grey banner
                    banner_elements = create_photos_report_banner()
                    story.extend(banner_elements)
                    
                    first_photo_page = False
                elif previous_group_num is not None:
                    # New photo group - add page break first, then header on new page
                    story.append(PageBreak())
                    
                    # Add header on new page
                    header_elements = create_photo_page_header(report_data)
                    story.extend(header_elements)
                    
                    # Add "PHOTOS REPORT" grey banner
                    banner_elements = create_photos_report_banner()
                    story.extend(banner_elements)
                
                previous_group_num = group_num
                
                # Group findings by photo (some photos have multiple findings)
                photo_findings_map = defaultdict(list)
                for photo in group_photos:
                    # Use storage_url as primary key, fallback to file_path, then finding_key
                    photo_key = (
                        photo.storage_url if hasattr(photo, 'storage_url') and photo.storage_url else 
                        (photo.file_path if hasattr(photo, 'file_path') and photo.file_path else 
                        (photo.finding_key if hasattr(photo, 'finding_key') and photo.finding_key else 
                        f"photo_{hash(str(photo))}"))
                    )
                    photo_findings_map[photo_key].append(photo)
                
                photo_keys_list = list(photo_findings_map.keys())
                print(f"📸 Created {len(photo_keys_list)} unique photo entries")
                
                # Process each photo in the group
                for idx, (photo_key, photo_list) in enumerate(photo_findings_map.items()):
                    print(f"📸 Processing photo {idx + 1}/{len(photo_keys_list)}: {photo_key[:50]}...")
                    
                    # Photo header bar (black bar) - matching reference
                    photo_header = Paragraph(f"Photo {group_num}", photo_header_style)
                    
                    photo = photo_list[0]  # Use first photo for image
                    
                    # Load image with labels - improved sizing and centering
                    photo_cell_content = None
                    try:
                        # Collect finding keys for labels
                        finding_keys = []
                        for p in photo_list:
                            if hasattr(p, 'finding_key') and p.finding_key:
                                finding_keys.append(p.finding_key)
                        
                        # Get photo URL/path - handle both dict and object styles
                        if isinstance(photo, dict):
                            photo_url = photo.get('storage_url') or photo.get('url') or photo.get('image_url') or photo.get('photo_url')
                            photo_path = photo.get('file_path') or photo.get('path') or photo.get('filepath')
                            photo_id = photo.get('id') or photo.get('photo_id')
                        else:
                            photo_url = getattr(photo, 'storage_url', None) or getattr(photo, 'url', None) or getattr(photo, 'image_url', None)
                            photo_path = getattr(photo, 'file_path', None) or getattr(photo, 'path', None)
                            photo_id = getattr(photo, 'id', None) or getattr(photo, 'photo_id', None)
                        
                        # If photo_url is an API endpoint (e.g., /api/photos/88/file), try to get file_path from database
                        if photo_url and ('/api/photos/' in photo_url or '/photos/' in photo_url) and not photo_path:
                            try:
                                # Extract photo ID from URL
                                import re
                                match = re.search(r'/photos/(\d+)/file', photo_url)
                                if match:
                                    db_photo_id = int(match.group(1))
                                    print(f"   🔍 API URL detected, fetching file_path from database for photo ID: {db_photo_id}")
                                    # Fetch photo from database to get file_path
                                    photo_res = self.db.table("Photo").select("file_path").eq("id", db_photo_id).execute()
                                    if photo_res.data and photo_res.data[0].get('file_path'):
                                        photo_path = photo_res.data[0]['file_path']
                                        print(f"   ✅ Found file_path in database: {photo_path}")
                                        # Prefer file_path over API URL
                                        photo_url = None
                            except Exception as e:
                                print(f"   ⚠️ Could not fetch file_path from database: {e}")
                        
                        # Check if this is an annotated image (data URL)
                        is_annotated = photo_url and photo_url.startswith('data:image/')
                        if is_annotated:
                            print(f"📸 Loading ANNOTATED image (data URL)")
                            print(f"   Data URL length: {len(photo_url)} characters")
                            print(f"   Data URL preview: {photo_url[:50]}...")
                            print(f"   Labels to add: {finding_keys}")
                        else:
                            print(f"📸 Loading ORIGINAL image: URL={photo_url is not None}, Path={photo_path is not None}, Labels={finding_keys}")
                            if not photo_url and not photo_path:
                                print(f"   ⚠️ WARNING: Photo has no storage_url or file_path! Photo object: {photo}")
                                # Last resort: try to get file_path from database using photo_id
                                if photo_id:
                                    try:
                                        print(f"   🔍 Attempting to fetch file_path from database for photo ID: {photo_id}")
                                        photo_res = self.db.table("Photo").select("file_path").eq("id", photo_id).execute()
                                        if photo_res.data and photo_res.data[0].get('file_path'):
                                            photo_path = photo_res.data[0]['file_path']
                                            print(f"   ✅ Found file_path in database: {photo_path}")
                                    except Exception as e:
                                        print(f"   ❌ Could not fetch file_path from database: {e}")
                        
                        img = await self._load_image_with_labels(
                            photo_url,
                            photo_path,
                            finding_keys if finding_keys else None
                        )
                        if img:
                            # Improved image sizing - match reference (proper aspect ratio, centered)
                            max_width = 90 * mm  # Photo column width
                            # Calculate available height (page height minus margins and space for text)
                            page_height = A4[1]  # A4 height in points
                            available_height = page_height - (2 * 15 * mm) - 100  # Leave space for header/footer/text
                            max_height = available_height
                            
                            current_width = getattr(img, 'drawWidth', None) or getattr(img, 'imageWidth', None)
                            current_height = getattr(img, 'drawHeight', None) or getattr(img, 'imageHeight', None)
                            
                            if current_width and current_height:
                                width = float(current_width)
                                height = float(current_height)
                                
                                # Validate dimensions
                                if width <= 0 or height <= 0 or width > 10000 or height > 10000:
                                    width = max_width
                                    height = max_width / 1.33
                                else:
                                    # Maintain aspect ratio while fitting constraints
                                    aspect_ratio = width / height
                                    
                                    # Fit to width first
                                    if width > max_width:
                                        width = max_width
                                        height = width / aspect_ratio
                                    
                                    # Then fit to height if needed
                                    if height > max_height:
                                        height = max_height
                                        width = height * aspect_ratio
                                    
                                    # Ensure minimum size
                                    if width < 10:
                                        width = 10
                                    if height < 10:
                                        height = 10
                                
                                img.drawWidth = width
                                img.drawHeight = height
                                if hasattr(img, 'imageWidth'):
                                    img.imageWidth = width
                                if hasattr(img, 'imageHeight'):
                                    img.imageHeight = height
                            else:
                                img.drawWidth = max_width
                                img.drawHeight = max_width / 1.33
                                if hasattr(img, 'imageWidth'):
                                    img.imageWidth = max_width
                                if hasattr(img, 'imageHeight'):
                                    img.imageHeight = max_width / 1.33
                            
                            photo_cell_content = img
                        else:
                            finding_key_str = getattr(photo, 'finding_key', 'N/A')
                            photo_cell_content = Paragraph(f"[Photo not available: {finding_key_str}]", finding_text_style)
                    except Exception as e:
                        import traceback
                        print(f"Error processing photo: {e}")
                        traceback.print_exc()
                        finding_key_str = getattr(photo, 'finding_key', 'N/A')
                        photo_cell_content = Paragraph(f"[Error loading photo: {str(e)}]", finding_text_style)
                    
                    # Build finding and recommendation text (matching reference format)
                    combined_text = ""
                    findings_texts = []
                    recommendations_texts = []
                    
                    for p in photo_list:
                        # Access attributes directly from PhotoItem model
                        finding_key = p.finding_key if hasattr(p, 'finding_key') and p.finding_key else ''
                        finding_text = p.finding_text if hasattr(p, 'finding_text') and p.finding_text else ''
                        recommendation_text = p.recommendation_text if hasattr(p, 'recommendation_text') and p.recommendation_text else ''
                        
                        print(f"📸 Photo data: key={finding_key}, finding_text={finding_text[:50] if finding_text else 'None'}..., rec_text={recommendation_text[:50] if recommendation_text else 'None'}...")
                        
                        # Always show finding text if available (even if empty, show the key)
                        if finding_text and finding_text.strip():
                            key_display = finding_key if finding_key else 'N/A'
                            findings_texts.append(f"<b>{key_display}:</b> {finding_text}")
                        elif finding_key:
                            # Show key even if no text
                            findings_texts.append(f"<b>{finding_key}:</b> (No finding text provided)")
                        
                        # Always show recommendation text if available
                        if recommendation_text and recommendation_text.strip() and recommendation_text.strip().lower() not in ['nil', 'nil.', 'none', 'n/a', 'na', '']:
                            key_display = finding_key if finding_key else 'N/A'
                            recommendations_texts.append(f"<b>{key_display}:</b> {recommendation_text}")
                    
                    if findings_texts:
                        combined_text += "<b>Finding:</b><br/>"
                        combined_text += "<br/>".join(findings_texts)
                    
                    if recommendations_texts:
                        if combined_text:
                            combined_text += "<br/><br/>"
                        combined_text += "<b>Recommendation:</b><br/>"
                        combined_text += "<br/>".join(recommendations_texts)
                    
                    if len(combined_text) > 3000:
                        combined_text = combined_text[:3000] + "<br/>... (text truncated)"
                    
                    text_cell = Paragraph(combined_text if combined_text else "No findings or recommendations", finding_text_style)
                    
                    # Create two-column layout with borders (matching reference)
                    photo_width = 90 * mm  # Photo column width
                    text_width = doc.width - photo_width - 10*mm  # Text column width (remaining space)
                    
                    photo_row = Table(
                        [[photo_cell_content, text_cell]],
                        colWidths=[photo_width, text_width]
                    )
                    
                    # Improved table styling with borders (matching reference)
                    photo_row.setStyle(TableStyle([
                        ('ALIGN', (0, 0), (0, 0), 'CENTER'),  # Center image
                        ('ALIGN', (1, 0), (1, 0), 'LEFT'),
                        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Vertically center image
                        ('LEFTPADDING', (0, 0), (-1, -1), 4),
                        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),  # Add border
                    ]))
                    
                    # Build complete photo block (header + photo) wrapped in KeepTogether
                    # Footer is handled by page template (appears once per page at bottom), not in each photo block
                    # This prevents splitting and allows ReportLab to fit multiple photos per page
                    photo_block = [
                        photo_header,
                        Spacer(1, 3*mm),
                        photo_row,
                        Spacer(1, 6*mm)  # Space after photo before next photo
                    ]
                    
                    # Use KeepTogether to prevent photo block from being split across pages
                    # ReportLab will automatically fit multiple blocks per page when space allows
                    story.append(KeepTogether(photo_block))
                    
                    # Smart page management: Let ReportLab handle page breaks naturally
                    # Only add explicit page break when we need a new header for next group
                    is_last_group = group_num == max(photo_groups.keys())
                    is_last_photo_in_group = idx == len(photo_keys_list) - 1
                    is_last_photo = is_last_group and is_last_photo_in_group
                    
                    # Check if next photo is in a different group - if so, add header before it
                    if not is_last_photo:
                        # Check if next photo is in a different group
                        next_group_num = None
                        # Find the next group number
                        sorted_groups = sorted(photo_groups.keys())
                        current_group_index = sorted_groups.index(group_num)
                        if current_group_index + 1 < len(sorted_groups):
                            next_group_num = sorted_groups[current_group_index + 1]
                        
                        # Check if next photo belongs to a different group
                        next_photo_in_different_group = False
                        if next_group_num and idx + 1 < len(photo_keys_list):
                            # The next photo will be processed in the next iteration
                            # We'll handle header addition before the next group starts
                            pass
                    else:
                        # Last photo in current group - check if there are more groups
                        if not is_last_group:
                            # More groups coming - add page break and header for next group
                            story.append(PageBreak())
                            # Add complete header table for new page
                            header_elements = create_photo_page_header(report_data)
                            story.extend(header_elements)
                            # Add "PHOTOS REPORT" grey banner on new page
                            banner_elements = create_photos_report_banner()
                            story.extend(banner_elements)
        
        
        # Build PDF and ensure file is properly closed
        try:
            doc.build(story)
            # Ensure file is closed before returning
            import gc
            gc.collect()
        except Exception as e:
            print(f"❌ Error building PDF: {e}")
            import traceback
            traceback.print_exc()
            raise
        
        # Verify file exists and is readable
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file was not created: {pdf_path}")
        
        # Check file size (should be > 0)
        file_size = os.path.getsize(pdf_path)
        if file_size == 0:
            raise ValueError(f"PDF file is empty: {pdf_path}")
        
        print(f"✅ PDF generated successfully: {pdf_path} ({file_size} bytes)")
        
        return pdf_path
    
    async def _safe_load_pil_image(self, storage_url: str = None, file_path: str = None):
        """
        Safely load PIL image from URL, data URL, or file path.
        Handles all image types and corrupted files.
        Returns PIL Image object or None if failed.
        
        IMPORTANT: If storage_url is a data URL (annotated image), it takes priority over file_path.
        This ensures annotated images are used instead of original files.
        """
        pil_img = None
        try:
            # CRITICAL: Check storage_url FIRST (especially for data URLs/annotated images)
            # Annotated images (data URLs) must take priority over file_path
            if storage_url:
                # Check if it's a data URL (base64 encoded image - annotated image)
                if storage_url.startswith('data:image/'):
                    print(f"   📝 Loading ANNOTATED image from data URL (ignoring file_path)")
                    # Extract base64 data from data URL
                    import base64
                    header, encoded = storage_url.split(',', 1)
                    img_data = base64.b64decode(encoded)
                    img_buffer = io.BytesIO(img_data)
                    pil_img = PILImage.open(img_buffer)
                    # Verify it's a valid image
                    pil_img.verify()
                    # Reopen because verify() closes the image
                    img_buffer.seek(0)
                    pil_img = PILImage.open(img_buffer)
                    print(f"   ✅ Successfully loaded annotated image: {pil_img.size[0]}x{pil_img.size[1]}")
                    # Return immediately - do NOT fall back to file_path
                    if pil_img:
                        # Convert to RGB if needed (required for JPEG)
                        if pil_img.mode not in ('RGB', 'L', 'P'):
                            pil_img = pil_img.convert('RGB')
                        elif pil_img.mode == 'P':
                            # Palette mode - convert to RGB
                            pil_img = pil_img.convert('RGB')
                        return pil_img
                else:
                    # Regular URL - download from URL
                    print(f"   📥 Loading image from URL: {storage_url[:50]}...")
                    response = requests.get(storage_url, timeout=10, stream=True)
                    if response.status_code == 200:
                        # Read into memory
                        img_data = io.BytesIO(response.content)
                        pil_img = PILImage.open(img_data)
                        # Verify it's a valid image
                        pil_img.verify()
                        # Reopen because verify() closes the image
                        img_data.seek(0)
                        pil_img = PILImage.open(img_data)
            
            # Only try file_path if storage_url was not provided or failed (and it's not a data URL)
            if not pil_img and file_path and os.path.exists(file_path):
                print(f"   📁 Loading image from file path: {file_path}")
                # Try to open local file
                pil_img = PILImage.open(file_path)
                # Verify it's a valid image
                pil_img.verify()
                # Reopen because verify() closes the image
                pil_img = PILImage.open(file_path)
            
            if pil_img:
                # Convert to RGB if needed (required for JPEG)
                if pil_img.mode not in ('RGB', 'L', 'P'):
                    pil_img = pil_img.convert('RGB')
                elif pil_img.mode == 'P':
                    # Palette mode - convert to RGB
                    pil_img = pil_img.convert('RGB')
                
                # Validate dimensions
                width, height = pil_img.size
                if width <= 0 or height <= 0:
                    print(f"Invalid image dimensions: {width}x{height}")
                    return None
                
                # Check for reasonable size (prevent memory issues)
                if width > 10000 or height > 10000:
                    print(f"Image too large: {width}x{height}, will resize")
                    # Resize if too large
                    max_dimension = 4000
                    if width > height:
                        new_width = max_dimension
                        new_height = int(height * (max_dimension / width))
                    else:
                        new_height = max_dimension
                        new_width = int(width * (max_dimension / height))
                    # Use LANCZOS resampling (compatible with older PIL versions)
                    try:
                        pil_img = pil_img.resize((new_width, new_height), PILImage.Resampling.LANCZOS)
                    except AttributeError:
                        # Fallback for older PIL versions
                        pil_img = pil_img.resize((new_width, new_height), PILImage.LANCZOS)
                
                return pil_img
        except PILImage.UnidentifiedImageError:
            print(f"Unidentified image format: {storage_url or file_path}")
            return None
        except Exception as e:
            print(f"Error loading PIL image: {e}")
            import traceback
            traceback.print_exc()
            return None
        
        return None
    
    async def _sanitize_labeled_image(self, labeled_path: str) -> PILImage.Image:
        """
        CRITICAL: Sanitize labeled image file immediately after drawing labels.
        This function:
        1. Re-opens the labeled file
        2. Removes all EXIF/JFIF metadata
        3. Validates and fixes dimensions
        4. Resizes to safe PDF size
        5. Saves with clean metadata
        6. Returns sanitized PIL Image
        
        This guarantees ReportLab will never see invalid dimensions or corrupted metadata.
        """
        try:
            # Step 1: Re-open the labeled image file
            img = PILImage.open(labeled_path)
            
            # Step 2: Convert to RGB if needed
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            elif img.mode == "RGBA":
                # Convert RGBA to RGB with white background
                rgb_img = PILImage.new("RGB", img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3] if len(img.split()) == 4 else None)
                img = rgb_img
            
            # Step 3: Get dimensions and validate
            w, h = img.size
            
            # Step 4: Force resize if dimensions are invalid
            if h > 10000 or w > 10000 or h <= 0 or w <= 0:
                print(f"⚠️ Invalid dimensions detected: {w}x{h}, forcing resize to 1200x800")
                img = img.resize((1200, 800), PILImage.Resampling.LANCZOS if hasattr(PILImage, 'Resampling') else PILImage.LANCZOS)
                w, h = img.size
            
            # Step 5: Resize to safe PDF size (max 600x400)
            max_w = 600
            max_h = 400
            scale = min(max_w / w, max_h / h, 1.0)  # Don't upscale
            
            if scale < 1.0:  # Only resize if needed
                new_w = int(w * scale)
                new_h = int(h * scale)
                # Ensure minimum size
                if new_w < 10:
                    new_w = 10
                if new_h < 10:
                    new_h = 10
                print(f"📐 Resizing labeled image: {w}x{h} -> {new_w}x{new_h} (scale: {scale:.3f})")
                img = img.resize((new_w, new_h), PILImage.Resampling.LANCZOS if hasattr(PILImage, 'Resampling') else PILImage.LANCZOS)
            
            # Step 6: Save sanitized image with clean metadata (overwrites corrupted EXIF/JFIF)
            # Use getdata/putdata to strip ALL metadata
            data = list(img.getdata())
            clean_img = PILImage.new('RGB', img.size)
            clean_img.putdata(data)
            
            # Save with optimize=True to ensure clean metadata
            clean_img.save(labeled_path, format="JPEG", quality=90, optimize=True)
            
            # Verify the sanitized file
            verify_img = PILImage.open(labeled_path)
            verify_w, verify_h = verify_img.size
            verify_img.close()
            
            if verify_w != clean_img.size[0] or verify_h != clean_img.size[1]:
                print(f"⚠️ Sanitized file dimension mismatch: Expected {clean_img.size}, Got {verify_w}x{verify_h}")
                # Force re-save
                clean_img.save(labeled_path, format="JPEG", quality=90, optimize=True)
            
            print(f"✅ Labeled image sanitized: {clean_img.size[0]}x{clean_img.size[1]}, file: {labeled_path}")
            
            return clean_img
            
        except Exception as e:
            print(f"❌ Error sanitizing labeled image: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def _validate_and_resize_image(self, pil_img: PILImage.Image, max_width: float, max_height: float):
        """
        Validate and resize PIL image to fit within max dimensions while maintaining aspect ratio.
        Returns resized PIL Image.
        """
        if not pil_img:
            return None
        
        try:
            orig_width, orig_height = pil_img.size
            
            # Calculate scaling factor
            width_scale = max_width / orig_width if orig_width > 0 else 1.0
            height_scale = max_height / orig_height if orig_height > 0 else 1.0
            scale = min(width_scale, height_scale, 1.0)  # Don't upscale
            
            # Calculate new dimensions
            new_width = int(orig_width * scale)
            new_height = int(orig_height * scale)
            
            # Ensure minimum size
            if new_width < 10:
                new_width = 10
            if new_height < 10:
                new_height = 10
            
            # Resize if needed
            if new_width != orig_width or new_height != orig_height:
                try:
                    pil_img = pil_img.resize((new_width, new_height), PILImage.Resampling.LANCZOS)
                except AttributeError:
                    # Fallback for older PIL versions
                    pil_img = pil_img.resize((new_width, new_height), PILImage.LANCZOS)
            
            return pil_img
        except Exception as e:
            print(f"Error validating/resizing image: {e}")
            return pil_img  # Return original if resize fails
    
    async def _build_safe_reportlab_image(self, pil_img: PILImage.Image, temp_filename: str = None, max_width_points: float = None, max_height_points: float = None):
        """
        Convert PIL image to ReportLab Image with validated dimensions.
        Saves to temp file and creates ReportLab Image object.
        ALWAYS sets dimensions based on PIL image size, not ReportLab auto-detection.
        Returns ReportLab Image or None if failed.
        """
        if not pil_img:
            return None
        
        try:
            # Get PIL image dimensions FIRST (these are reliable)
            pil_width, pil_height = pil_img.size
            
            # Validate PIL dimensions
            if pil_width <= 0 or pil_height <= 0:
                print(f"Invalid PIL image dimensions: {pil_width}x{pil_height}")
                return None
            
            # Convert PIL pixels to ReportLab points (1 pixel = 1 point at 72 DPI)
            # But we need to scale to fit max dimensions if provided
            width_points = float(pil_width)
            height_points = float(pil_height)
            
            # Apply max constraints if provided
            if max_width_points and width_points > max_width_points:
                scale = max_width_points / width_points
                width_points = max_width_points
                height_points = height_points * scale
            
            if max_height_points and height_points > max_height_points:
                scale = max_height_points / height_points
                height_points = max_height_points
                width_points = width_points * scale
            
            # Final validation - ensure reasonable size
            if width_points <= 0 or height_points <= 0:
                print(f"Invalid calculated dimensions: {width_points}x{height_points}")
                return None
            
            if width_points > 10000 or height_points > 10000:
                print(f"Dimensions too large: {width_points}x{height_points}, forcing resize")
                # Force resize if still too large
                if width_points > height_points:
                    scale = 10000 / width_points
                    width_points = 10000
                    height_points = height_points * scale
                else:
                    scale = 10000 / height_points
                    height_points = 10000
                    width_points = width_points * scale
            
            # Ensure minimum size
            if width_points < 10:
                width_points = 10
            if height_points < 10:
                height_points = 10
            
            # Generate temp filename if not provided
            if not temp_filename:
                temp_filename = f"safe_img_{datetime.utcnow().timestamp()}.jpg"
            
            temp_path = os.path.join(settings.REPORTS_DIR, temp_filename)
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            
            # Resize PIL image to match target dimensions if needed
            target_pil_width = int(width_points)
            target_pil_height = int(height_points)
            if pil_width != target_pil_width or pil_height != target_pil_height:
                try:
                    pil_img = pil_img.resize((target_pil_width, target_pil_height), PILImage.Resampling.LANCZOS)
                except AttributeError:
                    pil_img = pil_img.resize((target_pil_width, target_pil_height), PILImage.LANCZOS)
            
            # CRITICAL: Ensure PIL image is EXACTLY the target size BEFORE creating clean image
            # Resize source image to exact target dimensions first
            if pil_img.size != (target_pil_width, target_pil_height):
                try:
                    pil_img = pil_img.resize((target_pil_width, target_pil_height), PILImage.Resampling.LANCZOS)
                except AttributeError:
                    pil_img = pil_img.resize((target_pil_width, target_pil_height), PILImage.LANCZOS)
            
            # CRITICAL: Create a completely fresh image with EXACT dimensions and NO metadata
            # Use getdata/putdata to strip ALL metadata and create clean image
            data = list(pil_img.getdata())
            clean_img = PILImage.new('RGB', (target_pil_width, target_pil_height))
            clean_img.putdata(data)
            
            # CRITICAL: Save with NO optimization and NO EXIF/metadata
            # optimize=False ensures dimensions are preserved exactly
            clean_img.save(temp_path, 'JPEG', quality=95, optimize=False)
            
            # CRITICAL: Verify the file has correct dimensions by reading it back
            verify_img = PILImage.open(temp_path)
            verify_width, verify_height = verify_img.size
            verify_img.close()
            
            if verify_width != target_pil_width or verify_height != target_pil_height:
                print(f"❌ CRITICAL: File dimensions mismatch! Expected: {target_pil_width}x{target_pil_height}, Got: {verify_width}x{verify_height}")
                # Force recreate with exact dimensions
                final_data = list(pil_img.getdata())
                final_img = PILImage.new('RGB', (target_pil_width, target_pil_height))
                final_img.putdata(final_data)
                final_img.save(temp_path, 'JPEG', quality=95, optimize=False)
            
            # Load with ReportLab Image (constructor doesn't accept width/height params)
            rl_img = Image(temp_path)
            
            # CRITICAL: Check what ReportLab ACTUALLY read from the file
            # ReportLab reads dimensions from file metadata, not from our Python object
            if hasattr(rl_img, 'imageWidth') and hasattr(rl_img, 'imageHeight'):
                rl_width = float(rl_img.imageWidth) if rl_img.imageWidth else 0
                rl_height = float(rl_img.imageHeight) if rl_img.imageHeight else 0
                
                print(f"📊 ReportLab read from FILE: {rl_width}x{rl_height}, Target: {width_points}x{height_points}")
                
                # If ReportLab read invalid dimensions, the FILE itself is corrupted
                if rl_width <= 0 or rl_height <= 0 or rl_width > 10000 or rl_height > 10000:
                    print(f"❌ CRITICAL: ReportLab read INVALID dimensions from file: {rl_width}x{rl_height}")
                    print(f"   File metadata is corrupted. Recreating file...")
                    
                    # Recreate file using getdata/putdata method (strips all metadata)
                    recreate_data = list(pil_img.getdata())
                    recreate_img = PILImage.new('RGB', (target_pil_width, target_pil_height))
                    recreate_img.putdata(recreate_data)
                    
                    # Save to new file
                    new_temp_path = temp_path.replace('.jpg', '_recreated.jpg')
                    recreate_img.save(new_temp_path, 'JPEG', quality=95, optimize=False)
                    
                    # Reload ReportLab Image
                    rl_img = Image(new_temp_path)
                    temp_path = new_temp_path  # Update path
                    
                    # Check again
                    if hasattr(rl_img, 'imageWidth') and hasattr(rl_img, 'imageHeight'):
                        rl_width = float(rl_img.imageWidth) if rl_img.imageWidth else 0
                        rl_height = float(rl_img.imageHeight) if rl_img.imageHeight else 0
                        print(f"📊 After recreate, ReportLab read: {rl_width}x{rl_height}")
            
            # CRITICAL: Force set drawWidth/drawHeight - these control PDF rendering size
            # Even if imageWidth/imageHeight are wrong, drawWidth/drawHeight are what ReportLab uses for layout
            rl_img.drawWidth = width_points
            rl_img.drawHeight = height_points
            
            # Also override internal dimensions if they're wrong
            if hasattr(rl_img, 'imageWidth') and hasattr(rl_img, 'imageHeight'):
                current_rl_width = float(rl_img.imageWidth) if rl_img.imageWidth else 0
                current_rl_height = float(rl_img.imageHeight) if rl_img.imageHeight else 0
                
                if current_rl_width <= 0 or current_rl_height <= 0 or current_rl_width > 10000 or current_rl_height > 10000:
                    print(f"⚠️ Overriding invalid imageWidth/imageHeight: {current_rl_width}x{current_rl_height} -> {width_points}x{height_points}")
                    rl_img.imageWidth = width_points
                    rl_img.imageHeight = height_points
            
            # Final validation - ensure dimensions are valid
            final_width = getattr(rl_img, 'drawWidth', 0)
            final_height = getattr(rl_img, 'drawHeight', 0)
            
            if final_width <= 0 or final_height <= 0 or final_width > 10000 or final_height > 10000:
                print(f"❌ CRITICAL: Invalid final dimensions: {final_width}x{final_height}, using safe defaults")
                # Use safe defaults
                safe_width = min(max_width_points if max_width_points else 300, 300)
                safe_height = safe_width / 1.33
                rl_img.drawWidth = safe_width
                rl_img.drawHeight = safe_height
                if hasattr(rl_img, 'imageWidth'):
                    rl_img.imageWidth = safe_width
                if hasattr(rl_img, 'imageHeight'):
                    rl_img.imageHeight = safe_height
            
            # Debug logging
            print(f"✅ Image dimensions set: drawWidth={rl_img.drawWidth}, drawHeight={rl_img.drawHeight}, imageWidth={getattr(rl_img, 'imageWidth', 'N/A')}, imageHeight={getattr(rl_img, 'imageHeight', 'N/A')}")
            
            # CRITICAL: Wrap Image in FixedSizeImage to prevent ReportLab from recalculating dimensions
            # ReportLab may recalculate dimensions when rendering, so we wrap it to force dimensions
            try:
                fixed_img = FixedSizeImage(temp_path, width_points, height_points)
                print(f"✅ Wrapped image in FixedSizeImage: {width_points}x{height_points}")
                return fixed_img
            except Exception as e:
                print(f"⚠️ Warning: Failed to wrap image, using original: {e}")
                import traceback
                traceback.print_exc()
                # Fallback to original image
                return rl_img
        except Exception as e:
            print(f"Error building ReportLab image: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def _load_image(self, storage_url: str = None, file_path: str = None):
        """
        Safe image loader - loads image and converts to ReportLab Image.
        All images pass through validation and resizing.
        Returns FixedSizeImage wrapper to prevent dimension recalculation.
        """
        try:
            # Load PIL image safely
            pil_img = await self._safe_load_pil_image(storage_url, file_path)
            if not pil_img:
                return None
            
            # Convert to ReportLab Image (this will wrap it in FixedSizeImage)
            return await self._build_safe_reportlab_image(pil_img)
        except Exception as e:
            print(f"Error in _load_image: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def _load_image_with_labels(self, storage_url: str = None, file_path: str = None, labels: list = None):
        """
        Load image, overlay red finding number labels, validate, resize, and convert to ReportLab Image.
        All images pass through safe loader, validation, and resizing.
        
        IMPORTANT: If storage_url is a data URL (base64), it's an annotated image with user drawings.
        The annotated image is loaded FIRST, then finding key labels are added AFTER (preserving user annotations).
        """
        try:
            # If PIL is not available, just load image without labels
            if not HAS_PIL:
                return await self._load_image(storage_url, file_path)
            
            # Check if this is an annotated image (data URL)
            is_annotated = storage_url and storage_url.startswith('data:image/')
            
            if is_annotated:
                print(f"   📝 Detected ANNOTATED image (data URL) - will use annotated image directly and add finding labels")
                # CRITICAL: For annotated images, ONLY use storage_url, ignore file_path
                # This prevents overwriting the annotated image with the original file
                pil_img = await self._safe_load_pil_image(storage_url=storage_url, file_path=None)
            else:
                # For regular images, prioritize file_path over storage_url
                # file_path is more reliable as the backend can access it directly
                if file_path:
                    print(f"   📁 Using file_path for non-annotated photo: {file_path}")
                    pil_img = await self._safe_load_pil_image(storage_url=None, file_path=file_path)
                elif storage_url:
                    print(f"   📥 Using storage_url for non-annotated photo: {storage_url[:50]}...")
                    pil_img = await self._safe_load_pil_image(storage_url=storage_url, file_path=None)
                else:
                    print(f"   ❌ No file_path or storage_url provided for non-annotated photo")
                    pil_img = None
            
            if not pil_img:
                print(f"   ❌ ERROR: Unable to load image from storage_url or file_path")
                # Fallback to regular image loading
                return await self._load_image(storage_url, file_path)
            
            # Get original dimensions for label scaling
            orig_width, orig_height = pil_img.size
            
            # CRITICAL: Convert to RGBA mode for anti-aliased drawing
            # This ensures smooth edges and eliminates pixelation
            if pil_img.mode != 'RGBA':
                pil_img = pil_img.convert('RGBA')
            
            # HIGH-RESOLUTION RENDERING: Scale up image temporarily for crisp label rendering
            # Use 3x scale factor for maximum clarity, then scale back down smoothly
            scale_factor = 3
            high_res_width = orig_width * scale_factor
            high_res_height = orig_height * scale_factor
            
            # Resize image to high resolution using high-quality resampling
            try:
                pil_img_hr = pil_img.resize((high_res_width, high_res_height), PILImage.Resampling.LANCZOS)
            except AttributeError:
                # Fallback for older PIL versions
                pil_img_hr = pil_img.resize((high_res_width, high_res_height), PILImage.LANCZOS)
            
            # Create drawing context on high-res image (RGBA mode for anti-aliasing)
            draw_hr = ImageDraw.Draw(pil_img_hr, mode='RGBA')
            
            # Calculate label size - 20-30% larger than before, then scale for high-res
            base_size = min(orig_width, orig_height)
            box_width = max(70, int(base_size / 10))  # Increased by 20-30% (was /12, now /10)
            box_height = max(42, int(base_size / 14))  # Increased by 20-30% (was /18, now /14)
            
            # Scale dimensions for high-resolution canvas
            box_width_hr = box_width * scale_factor
            box_height_hr = box_height * scale_factor
            
            # Border width - thicker for visibility, scaled for high-res
            border_width = max(4, int(base_size / 120))  # Increased thickness
            border_width_hr = border_width * scale_factor
            
            # Corner radius for rounded corners (proportional to box size)
            corner_radius = max(5, int(box_width / 7))
            corner_radius_hr = corner_radius * scale_factor
            
            # Font size - larger and bold, scaled for high-res
            font_size = max(24, int(base_size / 20))  # Increased by 20% (was /25, now /20)
            font_size_hr = font_size * scale_factor
            
            # Try to load bold font for better visibility (high-res size)
            try:
                bold_font_hr = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", font_size_hr)
            except:
                try:
                    bold_font_hr = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size_hr)
                except:
                    try:
                        bold_font_hr = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size_hr)
                    except:
                        # Fallback: scale default font
                        try:
                            bold_font_hr = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", font_size_hr)
                        except:
                            bold_font_hr = ImageFont.load_default()
            
            # Draw red labels on high-resolution image (top-left area)
            # Professional, crisp, non-pixelated labels with rounded corners
            if labels:
                label_y_hr = 10 * scale_factor
                
                for idx, label in enumerate(labels):
                    # Position - top-left corner with consistent padding (scaled for high-res)
                    box_x_hr = 10 * scale_factor
                    box_y_hr = label_y_hr + (idx * (box_height_hr + 8 * scale_factor))
                    
                    # Ensure box doesn't go outside image bounds
                    if box_y_hr + box_height_hr > high_res_height - 10 * scale_factor:
                        break  # Stop if we run out of space
                    
                    # Draw rounded rectangle with solid red fill (#FF0000) on high-res canvas
                    # Use RGBA mode for perfect anti-aliasing
                    
                    # Draw main rectangle (filled red background)
                    draw_hr.rectangle(
                        [box_x_hr, box_y_hr, box_x_hr + box_width_hr, box_y_hr + box_height_hr],
                        fill=(255, 0, 0, 255),  # Solid red fill (#FF0000) with full opacity
                        outline=None
                    )
                    
                    # Create rounded corners by drawing circles at corners
                    # This creates smooth, anti-aliased rounded corners
                    corner_diameter_hr = corner_radius_hr * 2
                    
                    # Draw circles at each corner to create rounded effect
                    # Top-left corner
                    draw_hr.ellipse(
                        [box_x_hr, box_y_hr, box_x_hr + corner_diameter_hr, box_y_hr + corner_diameter_hr],
                        fill=(255, 0, 0, 255),
                        outline=None
                    )
                    
                    # Top-right corner
                    draw_hr.ellipse(
                        [box_x_hr + box_width_hr - corner_diameter_hr, box_y_hr, box_x_hr + box_width_hr, box_y_hr + corner_diameter_hr],
                        fill=(255, 0, 0, 255),
                        outline=None
                    )
                    
                    # Bottom-left corner
                    draw_hr.ellipse(
                        [box_x_hr, box_y_hr + box_height_hr - corner_diameter_hr, box_x_hr + corner_diameter_hr, box_y_hr + box_height_hr],
                        fill=(255, 0, 0, 255),
                        outline=None
                    )
                    
                    # Bottom-right corner
                    draw_hr.ellipse(
                        [box_x_hr + box_width_hr - corner_diameter_hr, box_y_hr + box_height_hr - corner_diameter_hr, box_x_hr + box_width_hr, box_y_hr + box_height_hr],
                        fill=(255, 0, 0, 255),
                        outline=None
                    )
                    
                    # Draw solid red border outline for crisp definition
                    draw_hr.rectangle(
                        [box_x_hr, box_y_hr, box_x_hr + box_width_hr, box_y_hr + box_height_hr],
                        outline=(200, 0, 0, 255),  # Darker red border for definition
                        width=border_width_hr
                    )
                    
                    # Calculate text position (centered in box)
                    label_text = str(label)
                    
                    # Get text bounding box for centering (high-res)
                    try:
                        # Try to get text size with bold font
                        bbox = draw_hr.textbbox((0, 0), label_text, font=bold_font_hr)
                        text_width_hr = bbox[2] - bbox[0]
                        text_height_hr = bbox[3] - bbox[1]
                    except:
                        # Fallback if textbbox not available (older PIL)
                        text_width_hr = len(label_text) * font_size_hr // 2
                        text_height_hr = font_size_hr
                    
                    # Center text horizontally and vertically
                    text_x_hr = box_x_hr + (box_width_hr - text_width_hr) // 2
                    text_y_hr = box_y_hr + (box_height_hr - text_height_hr) // 2 - 2 * scale_factor
                    
                    # Draw label text in bold white for maximum contrast
                    # Use anti-aliasing for smooth text rendering
                    # Add subtle text shadow for better readability (drawn first, then text on top)
                    shadow_offset_hr = 1 * scale_factor
                    draw_hr.text(
                        (text_x_hr + shadow_offset_hr, text_y_hr + shadow_offset_hr),
                        label_text,
                        fill=(150, 150, 150, 255),  # Dark gray shadow for depth
                        font=bold_font_hr
                    )
                    # Draw bold white text on top for crisp, readable labels
                    draw_hr.text(
                        (text_x_hr, text_y_hr),
                        label_text,
                        fill=(255, 255, 255, 255),  # Bold white text (#FFFFFF) with full opacity
                        font=bold_font_hr
                    )
            
            # CRITICAL: Scale back down to original size using high-quality resampling
            # This ensures perfect clarity and eliminates pixelation
            try:
                pil_img = pil_img_hr.resize((orig_width, orig_height), PILImage.Resampling.LANCZOS)
            except AttributeError:
                # Fallback for older PIL versions
                pil_img = pil_img_hr.resize((orig_width, orig_height), PILImage.LANCZOS)
            
            # Convert back to RGB if original was RGB (for JPEG compatibility)
            if pil_img.mode == 'RGBA':
                # Create white background for compositing
                rgb_img = PILImage.new('RGB', pil_img.size, (255, 255, 255))
                rgb_img.paste(pil_img, mask=pil_img.split()[3])  # Use alpha channel as mask
                pil_img = rgb_img
            
            # CRITICAL: Save labeled image FIRST, then sanitize it
            # This ensures we have a file to sanitize before ReportLab reads it
            temp_filename = f"labeled_temp_{datetime.utcnow().timestamp()}.jpg"
            temp_path = os.path.join(settings.REPORTS_DIR, temp_filename)
            os.makedirs(os.path.dirname(temp_path), exist_ok=True)
            
            # Save the labeled image (with labels drawn)
            pil_img.save(temp_path, 'JPEG', quality=95, optimize=False)
            
            # CRITICAL: Sanitize the labeled image file immediately after saving
            # This removes all corrupted EXIF/JFIF metadata and ensures clean dimensions
            sanitized_img = await self._sanitize_labeled_image(temp_path)
            if not sanitized_img:
                print(f"❌ Failed to sanitize labeled image, using fallback")
                return await self._load_image(storage_url, file_path)
            
            # Now pass the sanitized image to ReportLab
            # Convert sanitized PIL image to ReportLab Image
            max_pdf_width = 85 * mm  # 85mm max width
            max_pdf_height = (self.content_height - 100)  # Leave space for header/footer
            max_pdf_width_points = max_pdf_width
            max_pdf_height_points = max_pdf_height
            
            rl_img = await self._build_safe_reportlab_image(sanitized_img, temp_filename, max_pdf_width_points, max_pdf_height_points)
            
            if not rl_img:
                # Fallback to regular image loading
                return await self._load_image(storage_url, file_path)
            
            return rl_img
            
        except Exception as e:
            print(f"Error adding labels to image: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to regular image loading
            return await self._load_image(storage_url, file_path)
    
    async def export_report_pdf(self, report_id: str) -> dict:
        """Export report in PDF format for submission"""
        try:
            report = await self.get_report(report_id)
            
            if not report.pdf_path or not os.path.exists(report.pdf_path):
                raise HTTPException(status_code=404, detail="PDF not generated yet")
            
            return {
                "success": True,
                "pdf_path": report.pdf_path,
                "pdf_url": report.pdf_url,
                "message": "PDF ready for submission"
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error exporting PDF: {str(e)}")
    
    async def get_report(self, report_id: str) -> ReportResponse:
        """Get report by report_id (UUID string)"""
        try:
            res = self.db.table("Report").select("*").eq("report_id", report_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Report not found")
            
            # Ensure api_510_compliant is boolean
            db_record = res.data[0]
            api_510_value = db_record.get('api_510_compliant')
            if api_510_value is None:
                api_510_value = False
            elif isinstance(api_510_value, str):
                api_510_value = api_510_value.lower() in ('true', 'yes', '1')
            
            # Extract report_no from content JSON if available
            report_no = None
            try:
                if db_record.get('content'):
                    content_data = json.loads(db_record.get('content'))
                    if isinstance(content_data, dict) and 'header' in content_data:
                        report_no = content_data['header'].get('report_no')
            except Exception as e:
                print(f"⚠️ Error extracting report_no from content: {e}")
            
            response_data = {
                **db_record,
                'api_510_compliant': bool(api_510_value),
                'report_no': report_no,  # Add extracted report_no
            }
            
            return ReportResponse(**response_data)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching report: {str(e)}")
    
    async def get_equipment_reports(self, equipment_id: int) -> list[ReportResponse]:
        """Get all reports for an equipment"""
        try:
            res = self.db.table("Report").select("*").eq("equipment_id", equipment_id).execute()
            if res.data:
                # Ensure api_510_compliant is boolean for each report
                reports = []
                for db_record in res.data:
                    api_510_value = db_record.get('api_510_compliant')
                    if api_510_value is None:
                        api_510_value = False
                    elif isinstance(api_510_value, str):
                        api_510_value = api_510_value.lower() in ('true', 'yes', '1')
                    
                    # Extract report_no from content JSON if available
                    report_no = None
                    try:
                        if db_record.get('content'):
                            content_data = json.loads(db_record.get('content'))
                            if isinstance(content_data, dict) and 'header' in content_data:
                                report_no = content_data['header'].get('report_no')
                    except Exception as e:
                        print(f"⚠️ Error extracting report_no from content: {e}")
                    
                    response_data = {
                        **db_record,
                        'api_510_compliant': bool(api_510_value),
                        'report_no': report_no,  # Add extracted report_no
                    }
                    reports.append(ReportResponse(**response_data))
                return reports
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")