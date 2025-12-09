"""
Report Generation Service - Abdalla (Intelligent Report Generation)
Business logic for generating API 510-compliant reports with exact PDF formatting
Matches the exact layout from sample reports
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
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image, KeepTogether, Frame, PageTemplate, BaseDocTemplate, Flowable
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
        self.content_height = self.page_height - (2 * self.margin)
    
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
            print(f"   Photos count: {len(report_data.photos) if report_data.photos else 0}")
            print(f"   Findings count: {len(report_data.findings) if report_data.findings else 0}")
            print(f"   Recommendations count: {len(report_data.recommendations) if report_data.recommendations else 0}")
            
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
                "status": "COMPLETED",
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
                
                # Database already has report_id (UUID string) - use it directly
                response_data = {
                    **db_record,
                    'api_510_compliant': bool(api_510_value),  # Ensure it's a boolean
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
        1. COVER/HEADER PAGE (first page with full header)
        2. FINDINGS, NDTs & RECOMMENDATIONS PAGE
        3. PHOTOS REPORT PAGES (multi-page)
        4. SIGNATURE/APPROVAL SECTION (final)
        """
        pdf_filename = f"{base_filename}.pdf"
        pdf_path = os.path.join(settings.REPORTS_DIR, pdf_filename)
        
        # Create PDF document with optimized margins (matching reference)
        # Reduced margins to maximize content space while maintaining readability
        doc = BaseDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=12 * mm,  # Reduced from 15mm
            leftMargin=12 * mm,   # Reduced from 15mm
            topMargin=12 * mm,    # Reduced from 15mm
            bottomMargin=12 * mm  # Reduced from 15mm
        )
        
        # Define header frame (for header on every page)
        header_frame = Frame(
            doc.leftMargin,
            doc.height + doc.bottomMargin - 50*mm,
            doc.width,
            50*mm,
            id='header'
        )
        
        # Define main content frame
        main_frame = Frame(
            doc.leftMargin,
            doc.bottomMargin,
            doc.width,
            doc.height - 50*mm,
            id='main'
        )
        
        # Page template with header
        def draw_header_footer(canvas_obj, doc):
            """Draw header on every page"""
            canvas_obj.saveState()
            
            # Header background
            canvas_obj.setFillColor(colors.white)
            canvas_obj.rect(doc.leftMargin, doc.height + doc.bottomMargin - 50*mm, doc.width, 50*mm, fill=1, stroke=0)
            
            # Centered title block
            canvas_obj.setFont("Helvetica-Bold", 14)
            canvas_obj.setFillColor(colors.black)
            title_y = doc.height + doc.bottomMargin - 15*mm
            canvas_obj.drawCentredString(doc.leftMargin + doc.width/2, title_y, "MAJOR TURNAROUND 2025")
            canvas_obj.drawCentredString(doc.leftMargin + doc.width/2, title_y - 6*mm, "PRESSURE VESSEL INSPECTION REPORT")
            
            # Right-aligned report info box
            canvas_obj.setFont("Helvetica", 9)
            right_x = doc.leftMargin + doc.width - 5*mm
            info_y = title_y - 2*mm
            canvas_obj.drawRightString(right_x, info_y, f"Report no.: {report_data.header.report_no}")
            canvas_obj.drawRightString(right_x, info_y - 4*mm, f"Report date.: {report_data.header.report_date}")
            
            # Left and right equipment info rows
            left_x = doc.leftMargin + 5*mm
            bottom_y = doc.height + doc.bottomMargin - 45*mm
            
            # Left column
            canvas_obj.setFont("Helvetica", 9)
            canvas_obj.drawString(left_x, bottom_y, f"Equipment tag no.: {report_data.header.equipment_tag}")
            canvas_obj.drawString(left_x, bottom_y - 4*mm, f"Equipment description: {report_data.header.equipment_description}")
            
            # Right column
            right_col_x = doc.leftMargin + doc.width/2 + 10*mm
            canvas_obj.drawString(right_col_x, bottom_y, f"Plant/Unit/Area: {report_data.header.plant}")
            canvas_obj.drawString(right_col_x, bottom_y - 4*mm, f"DOSH registration no.: {report_data.header.dosh_no}")
            
            canvas_obj.restoreState()
        
        # Create page template
        page_template = PageTemplate(
            id='main_template',
            frames=[main_frame],
            onPage=draw_header_footer
        )
        
        doc.addPageTemplates([page_template])
        
        # Container for the 'Flowable' objects
        story = []
        
        # Define styles
        styles = getSampleStyleSheet()
        
        # Custom styles matching sample report exactly
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
        
        finding_label_style = ParagraphStyle(
            'FindingLabel',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.red,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            borderColor=colors.red,
            borderWidth=1,
            borderPadding=2,
            leftIndent=0,
            spaceAfter=2
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
        
        section_header_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Normal'],
            fontSize=11,
            textColor=colors.black,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            backColor=colors.HexColor('#E0E0E0'),  # Light gray background
            spaceAfter=6,
            spaceBefore=6,
            leading=13
        )
        
        finding_item_style = ParagraphStyle(
            'FindingItem',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            leftIndent=0,
            spaceAfter=3,
            leading=11
        )
        
        signature_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            spaceAfter=4,
            leading=11
        )
        
        # ============================================
        # PART 1: COVER/HEADER PAGE (FIRST PAGE)
        # ============================================
        # Create cover page with header info (centered, large title)
        cover_title_style = ParagraphStyle(
            'CoverTitle',
            parent=styles['Normal'],
            fontSize=16,
            textColor=colors.black,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            spaceAfter=10,
            leading=20
        )
        
        cover_subtitle_style = ParagraphStyle(
            'CoverSubtitle',
            parent=styles['Normal'],
            fontSize=14,
            textColor=colors.black,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            spaceAfter=20,
            leading=18
        )
        
        cover_info_style = ParagraphStyle(
            'CoverInfo',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.black,
            alignment=TA_LEFT,
            fontName='Helvetica',
            spaceAfter=6,
            leading=12
        )
        
        # Cover page content - Match reference exactly
        # Title centered at top
        story.append(Spacer(1, 20*mm))  # Reduced top spacing
        story.append(Paragraph("MAJOR TURNAROUND 2025", cover_title_style))
        story.append(Paragraph("PRESSURE VESSEL INSPECTION REPORT", cover_subtitle_style))
        story.append(Spacer(1, 15*mm))  # Reduced spacing
        
        # Header info - Report no. and date right-aligned (matching reference)
        header_info_style = ParagraphStyle(
            'HeaderInfo',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.black,
            alignment=TA_RIGHT,
            fontName='Helvetica',
            spaceAfter=2,
            leading=11
        )
        story.append(Paragraph(f"Report no.: {report_data.header.report_no or ''}", header_info_style))
        story.append(Paragraph(f"Report date.: {report_data.header.report_date or ''}", header_info_style))
        story.append(Spacer(1, 8*mm))
        
        # Equipment info in two-column table (matching reference layout)
        cover_info_data = [
            ['Equipment tag no.:', report_data.header.equipment_tag or '', 'Plant/Unit/Area:', report_data.header.plant or ''],
            ['Equipment description:', report_data.header.equipment_description or '', 'DOSH registration no.:', report_data.header.dosh_no or ''],
        ]
        
        cover_info_table = Table(cover_info_data, colWidths=[40*mm, 60*mm, 40*mm, 60*mm])
        cover_info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 2),
        ]))
        story.append(cover_info_table)
        story.append(PageBreak())  # End cover page
        
        # ============================================
        # PART 2: FINDINGS, NDTs & RECOMMENDATIONS PAGE (SECOND PAGE)
        # ============================================
        
        # Section header with gray background bar (matching reference)
        story.append(Paragraph(
            "FINDINGS, NDTS & RECOMMENDATIONS",
            section_header_style
        ))
        story.append(Spacer(1, 3*mm))  # Reduced spacing
        
        # Small descriptive text (matching reference)
        desc_text = "This section describes the condition of the equipment, including scales, deposits, corrosion, erosion, defects, and changes since the last inspection."
        story.append(Paragraph(desc_text, finding_item_style))
        story.append(Spacer(1, 4*mm))  # Reduced spacing
        
        # Initial/Pre-Inspection (matching reference format)
        story.append(Paragraph(
            f"<b>Initial/Pre-Inspection</b> — {report_data.initial_inspection_text or 'Not applicable'}",
            finding_item_style
        ))
        story.append(Spacer(1, 3*mm))  # Reduced spacing
        
        # Post/Final Inspection
        story.append(Paragraph("<b>Post/Final Inspection</b>", finding_item_style))
        story.append(Spacer(1, 2*mm))  # Reduced spacing
        
        # External Findings (1.x) - matching reference format
        external_findings = sorted([f for f in report_data.findings if f.key.startswith('1.')], 
                                   key=lambda x: (int(x.key.split('.')[0]), int(x.key.split('.')[1]) if '.' in x.key and len(x.key.split('.')) > 1 else 0))
        if external_findings:
            story.append(Paragraph("<b>External</b>", finding_item_style))
            for finding in external_findings:
                story.append(Paragraph(f"{finding.key}: {finding.text}", finding_item_style))
            story.append(Spacer(1, 2*mm))  # Reduced spacing
        
        # Internal Findings (2.x) - matching reference format
        internal_findings = sorted([f for f in report_data.findings if f.key.startswith('2.')],
                                   key=lambda x: (int(x.key.split('.')[0]), int(x.key.split('.')[1]) if '.' in x.key and len(x.key.split('.')) > 1 else 0))
        if internal_findings:
            story.append(Paragraph("<b>Internal</b>", finding_item_style))
            for finding in internal_findings:
                story.append(Paragraph(f"{finding.key}: {finding.text}", finding_item_style))
            story.append(Spacer(1, 2*mm))  # Reduced spacing
        
        # Other Findings (not 1.x or 2.x)
        other_findings = sorted([f for f in report_data.findings if not f.key.startswith('1.') and not f.key.startswith('2.')],
                               key=lambda x: (int(x.key.split('.')[0]) if '.' in x.key else 999, int(x.key.split('.')[1]) if '.' in x.key and len(x.key.split('.')) > 1 else 0))
        if other_findings:
            for finding in other_findings:
                story.append(Paragraph(f"{finding.key}: {finding.text}", finding_item_style))
            story.append(Spacer(1, 3*mm))
        
        story.append(Spacer(1, 3*mm))  # Reduced spacing
        
        # NON-DESTRUCTIVE TESTINGS section (matching reference)
        if report_data.ndt_text:
            story.append(Paragraph("<b>NON-DESTRUCTIVE TESTINGS:</b>", finding_item_style))
            story.append(Paragraph(f"UTTM: {report_data.ndt_text}", finding_item_style))
            story.append(Spacer(1, 3*mm))  # Reduced spacing
        
        # RECOMMENDATIONS section (matching reference)
        if report_data.recommendations:
            story.append(Paragraph("<b>RECOMMENDATIONS:</b>", finding_item_style))
            sorted_recs = sorted(report_data.recommendations,
                               key=lambda x: (int(x.key.split('.')[0]) if '.' in x.key else 999, int(x.key.split('.')[1]) if '.' in x.key and len(x.key.split('.')) > 1 else 0))
            for rec in sorted_recs:
                story.append(Paragraph(f"{rec.key}: {rec.text}", finding_item_style))
            story.append(Spacer(1, 4*mm))  # Reduced spacing
        
        story.append(PageBreak())  # End Findings page
        
        # ============================================
        # PART 3: PHOTOS REPORT SECTION (Multi-page) - THIRD SECTION
        # ============================================
        
        # Group photos by finding key prefix (observation number)
        if not report_data.photos:
            report_data.photos = []
        
        sorted_photos = sorted(report_data.photos, key=lambda p: (
            int(p.finding_key.split('.')[0]) if p.finding_key and '.' in p.finding_key else 999,
            int(p.finding_key.split('.')[1]) if p.finding_key and '.' in p.finding_key and len(p.finding_key.split('.')) > 1 else 999
        ))
        
        # Group photos by observation number (Photo 1, Photo 2, etc.)
        photo_groups = defaultdict(list)
        photo_group_numbers = {}
        
        for photo in sorted_photos:
            if not photo.finding_key:
                continue
            obs_num = photo.finding_key.split('.')[0] if '.' in photo.finding_key else '1'
            if obs_num not in photo_group_numbers:
                photo_group_numbers[obs_num] = len(photo_group_numbers) + 1
            group_key = photo_group_numbers[obs_num]
            photo_groups[group_key].append(photo)
        
        # Generate photo pages (only if there are photos)
        if photo_groups:
            for group_num in sorted(photo_groups.keys()):
                group_photos = photo_groups[group_num]
                
                # Group findings by photo (some photos have multiple findings)
                photo_findings_map = defaultdict(list)
                for photo in group_photos:
                    photo_key = (
                        getattr(photo, 'storage_url', None) or 
                        getattr(photo, 'file_path', None) or 
                        getattr(photo, 'finding_key', None) or 
                        str(hash(str(photo)))
                    )
                    photo_findings_map[photo_key].append(photo)
                
                photo_keys_list = list(photo_findings_map.keys())
                
                # Create one page per unique photo (matching reference format)
                for idx, (photo_key, photo_list) in enumerate(photo_findings_map.items()):
                    # Photo header bar (black bar) - matching reference
                    photo_header = Paragraph(f"Photo {group_num}", photo_header_style)
                    story.append(photo_header)
                    story.append(Spacer(1, 3*mm))  # Slightly increased spacing
                    
                    photo = photo_list[0]  # Use first photo for image
                    
                    # Load image with labels - improved sizing and centering
                    photo_cell_content = None
                    try:
                        finding_keys = [getattr(p, 'finding_key', None) for p in photo_list if getattr(p, 'finding_key', None)]
                        img = await self._load_image_with_labels(
                            getattr(photo, 'storage_url', None),
                            getattr(photo, 'file_path', None),
                            finding_keys
                        )
                        if img:
                            # Improved image sizing - match reference (proper aspect ratio, centered)
                            max_width = 90 * mm  # Slightly larger for better visibility
                            max_height = self.content_height - 120  # Leave space for header/footer/text
                            
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
                        finding_key = getattr(p, 'finding_key', '') or ''
                        finding_text = getattr(p, 'finding_text', '') or ''
                        recommendation_text = getattr(p, 'recommendation_text', '') or ''
                        
                        if finding_text:
                            findings_texts.append(f"<b>{finding_key}:</b> {finding_text}")
                        
                        if recommendation_text and recommendation_text.strip().lower() not in ['nil', 'nil.', 'none', '']:
                            recommendations_texts.append(f"<b>{finding_key}:</b> {recommendation_text}")
                    
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
                    photo_width = 90 * mm  # Slightly larger
                    text_width = self.content_width - photo_width - 10*mm  # Adjusted spacing
                    
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
                    
                    story.append(photo_row)
                    story.append(Spacer(1, 6*mm))  # Reduced spacing
                    
                    # Footer for photo pages (matching reference)
                    footer_data = [
                        ['Inspected by:', report_data.header.inspector_name or ''],
                        ['Date:', report_data.header.report_date or ''],
                    ]
                    
                    footer_table = Table(footer_data, colWidths=[30*mm, self.content_width - 30*mm])
                    footer_table.setStyle(TableStyle([
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                        ('TOPPADDING', (0, 0), (-1, -1), 2),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
                    ]))
                    
                    story.append(footer_table)
                    
                    # Page break after each photo (except last)
                    is_last_group = group_num == max(photo_groups.keys())
                    is_last_photo_in_group = idx == len(photo_keys_list) - 1
                    if not (is_last_group and is_last_photo_in_group):
                        story.append(PageBreak())
        
        # ============================================
        # PART 4: SIGNATURE/APPROVAL SECTION (FINAL)
        # ============================================
        
        # Signature block
        signature_data = [
            ['Inspected by:', report_data.header.inspector_name or ''],
            ['Reviewed by:', report_data.header.reviewed_by or ''],
            ['Approved by (Client):', report_data.header.client_approver or ''],
        ]
        
        signature_table = Table(signature_data, colWidths=[40*mm, 80*mm])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        
        story.append(signature_table)
        story.append(Spacer(1, 6*mm))
        
        # DOSH Officer section
        story.append(Paragraph("<b>Recommendation/Comment by DOSH Officer (if applicable):</b>", signature_style))
        story.append(Spacer(1, 2*mm))
        
        dosh_fields = [
            ['Name:', '____________'],
            ['Signature:', '____________'],
            ['Date:', '____________'],
        ]
        
        dosh_table = Table(dosh_fields, colWidths=[30*mm, 100*mm])
        dosh_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        
        story.append(dosh_table)
        story.append(Spacer(1, 6*mm))
        
        # Plant 1 action section
        story.append(Paragraph("<b>Action taken by Plant 1 on recommendation by DOSH (if applicable):</b>", signature_style))
        story.append(Spacer(1, 2*mm))
        
        plant_fields = [
            ['Name:', '____________'],
            ['Signature:', '____________'],
            ['Date:', '____________'],
        ]
        
        plant_table = Table(plant_fields, colWidths=[30*mm, 100*mm])
        plant_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        
        story.append(plant_table)
        
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
        Safely load PIL image from URL or file path.
        Handles all image types and corrupted files.
        Returns PIL Image object or None if failed.
        """
        pil_img = None
        try:
            if file_path and os.path.exists(file_path):
                # Try to open local file
                pil_img = PILImage.open(file_path)
                # Verify it's a valid image
                pil_img.verify()
                # Reopen because verify() closes the image
                pil_img = PILImage.open(file_path)
            elif storage_url:
                # Download from URL
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
        """
        try:
            # If PIL is not available, just load image without labels
            if not HAS_PIL:
                return await self._load_image(storage_url, file_path)
            
            # Load PIL image safely
            pil_img = await self._safe_load_pil_image(storage_url, file_path)
            if not pil_img:
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
            
            response_data = {
                **db_record,
                'api_510_compliant': bool(api_510_value),
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
                    
                    response_data = {
                        **db_record,
                        'api_510_compliant': bool(api_510_value),
                    }
                    reports.append(ReportResponse(**response_data))
                return reports
            return []
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching reports: {str(e)}")

