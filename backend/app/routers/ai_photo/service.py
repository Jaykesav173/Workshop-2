"""
AI Photo Service
Business logic for AI-powered defect detection using OpenAI Vision API
"""
from fastapi import HTTPException, UploadFile
from app.database.connection import get_db
from app.config import settings
from app.utils.storage import upload_file_to_storage, is_valid_image_url
import base64
import json
import os
import mimetypes
import re
from typing import List, Dict
from datetime import datetime

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("Warning: openai package not installed. AI photo analysis will not work.")

class AIPhotoService:
    def __init__(self):
        self.client = None
        if not OPENAI_AVAILABLE:
            print("[ERROR] OpenAI package is not available. Please install it with: pip install openai")
            return
        
        api_key = settings.OPENAI_API_KEY
        if api_key:
            if not api_key.startswith('sk-'):
                print(f"[WARNING] OPENAI_API_KEY does not look valid (should start with 'sk-'). Length: {len(api_key)}")
            
            try:
                self.client = OpenAI(api_key=api_key)
                print("[OK] OpenAI client initialized successfully")
            except Exception as e:
                print(f"[ERROR] Failed to initialize OpenAI client: {e}")
                import traceback
                print(traceback.format_exc())
        else:
            print("[WARNING] OPENAI_API_KEY not configured in environment variables")
            print("   Please add OPENAI_API_KEY to your .env file in VISOR/backend/app/.env")
            print("   Get your API key from: https://platform.openai.com/api-keys")
    
    def _get_db(self):
        return get_db()
    
    async def analyze_photos(self, files: List[UploadFile]) -> Dict:
        if not self.client:
            print("Error: OpenAI client is not initialized")
            raise HTTPException(status_code=500, detail="OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.")
        
        if not files or len(files) == 0:
            raise HTTPException(status_code=400, detail="No files provided for analysis")
        
        results = []
        
        for file in files:
            try:
                print(f"Analyzing file: {file.filename}")
                contents = await file.read()
                
                if not contents or len(contents) == 0:
                    raise ValueError(f"File {file.filename} is empty")
                
                mime_type = mimetypes.guess_type(file.filename)[0] or "image/jpeg"
                base64_image = base64.b64encode(contents).decode('utf-8')
                print(f"File {file.filename} encoded, size: {len(base64_image)} characters")
                
                # Structured prompt for parsing
                prompt_text = """You are an expert industrial inspector analyzing photos for equipment maintenance. 
Your task is to identify ANY potential defects, anomalies, wear, or damage in the image. 
Even if the defect is minor, you must report it. If the image appears clean, describe the condition of the equipment.

Provide your response in the following EXACT format:

DESCRIPTION: [Plain language description of the defect or condition. Focus on details like rust, cracks, dents, wear patterns, or discoloration. Do not use markdown or bullet points.]

RECOMMENDATION: [Specific maintenance action required. E.g., 'Clean and apply anti-corrosion coating', 'Monitor for propagation', 'Replace component'.]

CATEGORY: [ONE of: CORROSION, CRACK, DAMAGE, WEAR, DEFORMATION, UNKNOWN]

SEVERITY: [ONE of: LOW, MEDIUM, HIGH, CRITICAL]

Important: 
- Use professional technical language.
- DESCRIPTION must be a single paragraph.
- RECOMMENDATION must be actionable.
- Category must be exactly one of the list above.
- Severity must be exactly one of the list above.
- DO NOT refuse to analyze. If unsure, mark as UNKNOWN category and LOW severity, and describe what looks unusual."""
                
                response = self.client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt_text
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}
                            }
                        ]
                    }],
                    max_tokens=500
                )
                
                print(f"OpenAI API call successful for {file.filename}")
                
                if not response.choices or len(response.choices) == 0:
                    raise ValueError("No response from OpenAI API")
                
                ai_text = response.choices[0].message.content
                if not ai_text:
                    raise ValueError("Empty response from OpenAI API")
                
                print(f"AI Response for {file.filename}: {ai_text[:300]}...")
                
                # Initialize defaults
                description = ""
                recommendation = "Please review the inspection findings."
                category = "UNKNOWN"
                severity = "MEDIUM"
                box_2d = []
                
                # Parse structured response
                ai_text_upper = ai_text.upper()
                lines = ai_text.split("\n")
                
                # Allowed category and severity values
                ALLOWED_CATEGORIES = ["CORROSION", "CRACK", "DAMAGE", "WEAR", "DEFORMATION", "UNKNOWN"]
                ALLOWED_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
                
                # Extract DESCRIPTION
                description_section = None
                for i, line in enumerate(lines):
                    if line.strip().upper().startswith("DESCRIPTION:"):
                        # Found description section
                        desc_text = line.split(":", 1)[1].strip() if ":" in line else ""
                        # Collect remaining lines until next section
                        desc_lines = [desc_text] if desc_text else []
                        for j in range(i + 1, len(lines)):
                            next_line = lines[j].strip()
                            if next_line and (next_line.upper().startswith("RECOMMENDATION:") or 
                                            next_line.upper().startswith("CATEGORY:") or 
                                            next_line.upper().startswith("SEVERITY:")):
                                break
                            if next_line:
                                desc_lines.append(next_line)
                        description_section = " ".join(desc_lines).strip()
                        break
                
                # Extract RECOMMENDATION
                recommendation_section = None
                for i, line in enumerate(lines):
                    if line.strip().upper().startswith("RECOMMENDATION:"):
                        rec_text = line.split(":", 1)[1].strip() if ":" in line else ""
                        rec_lines = [rec_text] if rec_text else []
                        for j in range(i + 1, len(lines)):
                            next_line = lines[j].strip()
                            if next_line and (next_line.upper().startswith("DESCRIPTION:") or 
                                            next_line.upper().startswith("CATEGORY:") or 
                                            next_line.upper().startswith("SEVERITY:")):
                                break
                            if next_line:
                                rec_lines.append(next_line)
                        recommendation_section = " ".join(rec_lines).strip()
                        break
                
                # Extract CATEGORY
                for line in lines:
                    line_upper = line.strip().upper()
                    if line_upper.startswith("CATEGORY:"):
                        cat_text = line.split(":", 1)[1].strip() if ":" in line else ""
                        cat_upper = cat_text.upper().strip()
                        # Map to allowed category
                        if "CORROSION" in cat_upper or "RUST" in cat_upper:
                            category = "CORROSION"
                        elif "CRACK" in cat_upper:
                            category = "CRACK"
                        elif "DAMAGE" in cat_upper or "DENT" in cat_upper:
                            category = "DAMAGE"
                        elif "WEAR" in cat_upper:
                            category = "WEAR"
                        elif "DEFORMATION" in cat_upper or "DEFORM" in cat_upper:
                            category = "DEFORMATION"
                        else:
                            # Check if exact match
                            if cat_upper in ALLOWED_CATEGORIES:
                                category = cat_upper
                            else:
                                category = "UNKNOWN"
                        break
                
                # Extract SEVERITY
                for line in lines:
                    line_upper = line.strip().upper()
                    if line_upper.startswith("SEVERITY:"):
                        sev_text = line.split(":", 1)[1].strip() if ":" in line else ""
                        sev_upper = sev_text.upper().strip()
                        # Map to allowed severity
                        if "CRITICAL" in sev_upper or "SEVERE" in sev_upper:
                            severity = "CRITICAL"
                        elif "HIGH" in sev_upper:
                            severity = "HIGH"
                        elif "LOW" in sev_upper or "MINOR" in sev_upper:
                            severity = "LOW"
                        else:
                            # Check if exact match
                            if sev_upper in ALLOWED_SEVERITIES:
                                severity = sev_upper
                            else:
                                severity = "MEDIUM"  # Default
                        break
                
                # If structured parsing failed, try fallback parsing
                if not description_section:
                    # Fallback: try to extract description by removing sections
                    desc_lines = []
                    in_desc = True
                    for line in lines:
                        line_stripped = line.strip()
                        if not line_stripped:
                            continue
                        line_upper = line_stripped.upper()
                        if (line_upper.startswith("RECOMMENDATION:") or 
                            line_upper.startswith("CATEGORY:") or 
                            line_upper.startswith("SEVERITY:") or
                            line_upper.startswith("###") or
                            line_upper.startswith("##") or
                            line_upper.startswith("#")):
                            in_desc = False
                            continue
                        if in_desc and not any(keyword in line_upper for keyword in 
                                               ["RECOMMENDATION", "CATEGORY", "SEVERITY", "CORROSION", 
                                                "CRACK", "DAMAGE", "WEAR", "DEFORMATION", "UNKNOWN",
                                                "LOW", "MEDIUM", "HIGH", "CRITICAL"]):
                            desc_lines.append(line_stripped)
                    description_section = " ".join(desc_lines).strip()
                
                if not recommendation_section:
                    # Fallback: look for recommendation patterns
                    ai_text_lower = ai_text.lower()
                    patterns = ["recommendation:", "recommend:", "action:", "should"]
                    for pattern in patterns:
                        if pattern in ai_text_lower:
                            idx = ai_text_lower.find(pattern)
                            after_pattern = ai_text[idx + len(pattern):].strip()
                            if after_pattern.startswith(":"):
                                after_pattern = after_pattern[1:].strip()
                            # Take text until next section or newline
                            rec_lines = []
                            for rec_line in after_pattern.split("\n"):
                                rec_line = rec_line.strip()
                                if not rec_line or rec_line.upper().startswith(("CATEGORY:", "SEVERITY:", "DESCRIPTION:")):
                                    break
                                if not any(keyword in rec_line.upper() for keyword in 
                                          ["CATEGORY", "SEVERITY", "CORROSION", "CRACK", "DAMAGE", 
                                           "WEAR", "DEFORMATION", "UNKNOWN", "LOW", "MEDIUM", "HIGH", "CRITICAL"]):
                                    rec_lines.append(rec_line)
                            if rec_lines:
                                recommendation_section = " ".join(rec_lines[:3]).strip()  # First 3 lines max
                                break
                
                # Clean up description: remove markdown, headings, labels, category/severity mentions
                description = description_section if description_section else ""
                description = description.replace("###", "").replace("##", "").replace("#", "")
                description = description.replace("*", "").replace("-", "").replace("•", "")
                description = description.replace("DESCRIPTION:", "").replace("Description:", "")
                
                # Remove any category or severity mentions from description
                for cat in ALLOWED_CATEGORIES:
                    description = description.replace(cat, "").replace(cat.lower(), "").replace(cat.capitalize(), "")
                    # Also remove common variations
                    if cat == "CORROSION":
                        description = description.replace("rust", "").replace("Rust", "").replace("RUST", "")
                    elif cat == "CRACK":
                        description = description.replace("crack", "").replace("Crack", "").replace("CRACK", "")
                    elif cat == "DAMAGE":
                        description = description.replace("damage", "").replace("Damage", "").replace("DAMAGE", "")
                        description = description.replace("dent", "").replace("Dent", "").replace("DENT", "")
                
                for sev in ALLOWED_SEVERITIES:
                    description = description.replace(sev, "").replace(sev.lower(), "").replace(sev.capitalize(), "")
                    # Also remove common variations
                    if sev == "CRITICAL":
                        description = description.replace("severe", "").replace("Severe", "").replace("SEVERE", "")
                    elif sev == "LOW":
                        description = description.replace("minor", "").replace("Minor", "").replace("MINOR", "")
                
                # Clean up recommendation: remove markdown, labels, category/severity mentions
                recommendation = recommendation_section if recommendation_section else recommendation
                recommendation = recommendation.replace("###", "").replace("##", "").replace("#", "")
                recommendation = recommendation.replace("*", "").replace("-", "").replace("•", "")
                recommendation = recommendation.replace("RECOMMENDATION:", "").replace("Recommendation:", "")
                
                # Remove any category or severity mentions from recommendation
                for cat in ALLOWED_CATEGORIES:
                    recommendation = recommendation.replace(cat, "").replace(cat.lower(), "").replace(cat.capitalize(), "")
                    if cat == "CORROSION":
                        recommendation = recommendation.replace("rust", "").replace("Rust", "").replace("RUST", "")
                    elif cat == "CRACK":
                        recommendation = recommendation.replace("crack", "").replace("Crack", "").replace("CRACK", "")
                
                for sev in ALLOWED_SEVERITIES:
                    recommendation = recommendation.replace(sev, "").replace(sev.lower(), "").replace(sev.capitalize(), "")
                    if sev == "CRITICAL":
                        recommendation = recommendation.replace("severe", "").replace("Severe", "").replace("SEVERE", "")
                
                # Final cleanup: remove extra whitespace and ensure single spaces
                description = " ".join(description.split()).strip()
                recommendation = " ".join(recommendation.split()).strip()
                
                # Remove leading/trailing punctuation that might be left after removing keywords
                description = description.strip(".,:;!?-")
                recommendation = recommendation.strip(".,:;!?-")
                
                # Ensure we have at least something in description
                if not description or len(description) < 10:
                    # Last resort: use first meaningful sentence from AI response
                    all_lines = [l.strip() for l in lines if l.strip() and not l.strip().upper().startswith(("DESCRIPTION:", "RECOMMENDATION:", "CATEGORY:", "SEVERITY:"))]
                    fallback = all_lines[0] if all_lines else ai_text.split(".")[0] if "." in ai_text else ai_text[:200]
                    # Clean fallback
                    for cat in ALLOWED_CATEGORIES:
                        fallback = fallback.replace(cat, "").replace(cat.lower(), "").replace(cat.capitalize(), "")
                    for sev in ALLOWED_SEVERITIES:
                        fallback = fallback.replace(sev, "").replace(sev.lower(), "").replace(sev.capitalize(), "")
                    description = " ".join(fallback.split()).strip(".,:;!?-")[:200]
                
                # Validate category and severity (must be in allowed lists)
                if category not in ALLOWED_CATEGORIES:
                    category = "UNKNOWN"
                if severity not in ALLOWED_SEVERITIES:
                    severity = "MEDIUM"
                
                print(f"Parsed findings for {file.filename}:")
                print(f"  Description ({len(description)} chars): {description[:150]}...")
                print(f"  Recommendation ({len(recommendation)} chars): {recommendation[:150]}...")
                print(f"  Category: {category}")
                print(f"  Severity: {severity}")
                
                result_item = {
                    "filename": file.filename,
                    "ai_findings": {
                        "description": description,
                        "recommendation": recommendation,
                        "category": category,
                        "severity": severity,
                        "box_2d": box_2d
                    }
                }
                
                print(f"Successfully analyzed {file.filename}")
                print(f"Result structure: {result_item}")
                print(f"Description length: {len(description)}, Category: {category}, Severity: {severity}")
                
                results.append(result_item)
            except Exception as e:
                error_msg = str(e)
                print(f"Error analyzing {file.filename}: {error_msg}")
                import traceback
                print(traceback.format_exc())
                
                results.append({
                    "filename": file.filename,
                    "error": error_msg,
                    "ai_findings": {
                        "description": f"Error analyzing image: {error_msg}",
                        "recommendation": "Please review manually.",
                        "category": "UNKNOWN",
                        "severity": "MEDIUM",
                        "box_2d": []
                    }
                })
        
        print(f"Analysis complete. Processed {len(results)} files.")
        return {"results": results}
    
    async def confirm_defect(self, file: UploadFile, ai_description: str, ai_recommendation: str, category: str, severity: str, box_2d: str, current_user: dict) -> Dict:
        try:
            try:
                box_data = json.loads(box_2d) if box_2d else []
                box_2d_str = json.dumps(box_data) if box_data else None
            except:
                box_data = []
                box_2d_str = None
            
            # Read file content
            contents = await file.read()
            file_size = len(contents)
            
            # Upload to Supabase Storage
            print(f"Uploading file {file.filename} to Supabase Storage...")
            storage_url = upload_file_to_storage(
                file_content=contents,
                filename=file.filename,
                bucket_name="photos",
                folder="photos"
            )
            
            if not storage_url:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to upload image to Supabase Storage. Please try again."
                )
            
            print(f"File uploaded successfully. Public URL: {storage_url}")
            
            db = self._get_db()
            
            uploaded_by = current_user.get("id")
            try:
                uploaded_by = int(uploaded_by) if uploaded_by else None
            except (ValueError, TypeError):
                print(f"Error: Invalid user ID type: {type(uploaded_by)}, value: {uploaded_by}")
                raise HTTPException(status_code=400, detail=f"Invalid user ID: {uploaded_by}")
            
            if not uploaded_by:
                raise HTTPException(status_code=401, detail="User ID not found in authentication token")
            
            # Store only the Supabase Storage URL, not local paths
            photo_data = {
                "file_name": file.filename,
                "file_path": storage_url,  # Keep for backward compatibility, but use Supabase URL
                "storage_url": storage_url,  # Public Supabase Storage URL
                "file_size": file_size,
                "uploaded_by": uploaded_by,
                "ai_description": ai_description,
                "ai_recommendation": ai_recommendation,
                "category": category,
                "severity": severity,
                "box_2d": box_2d_str,
                "part_view": "GENERAL"
            }
            
            try:
                res = db.table("Photo").insert(photo_data).execute()
                if res.data:
                    print(f"Defect saved to database with storage_url: {storage_url}")
                    return {"success": True, "defect": res.data[0]}
                else:
                    raise HTTPException(status_code=500, detail="Failed to save defect - no data returned")
            except Exception as db_error:
                print(f"Error: Failed to save to Photo table: {db_error}")
                import traceback
                print(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Error saving defect to database: {str(db_error)}")
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error saving defect: {str(e)}")
    
    async def get_my_defects(self, current_user: dict) -> List[Dict]:
        try:
            user_id = current_user.get("id")
            if not user_id:
                print("Warning: No user ID found in current_user")
                return []
            
            try:
                user_id = int(user_id)
            except (ValueError, TypeError):
                print(f"Error: Invalid user_id type: {type(user_id)}, value: {user_id}")
                raise HTTPException(status_code=400, detail=f"Invalid user ID: {user_id}")
            
            db = self._get_db()
            
            try:
                print(f"Fetching defects for user_id: {user_id} (type: {type(user_id)})")
                res = db.table("Photo").select("*").eq("uploaded_by", user_id).execute()
                print(f"Query executed. Found {len(res.data) if res.data else 0} total photos")
                
                if res.data:
                    ai_defects = []
                    for photo in res.data:
                        ai_desc = photo.get("ai_description")
                        if ai_desc is not None and str(ai_desc).strip() != "":
                            # Validate and sanitize storage_url - reject local paths
                            storage_url = photo.get("storage_url")
                            if storage_url and not is_valid_image_url(storage_url):
                                print(f"Warning: Photo {photo.get('id')} has invalid storage_url (local path): {storage_url}")
                                # Mark as invalid - don't include in results or set storage_url to None
                                photo["storage_url"] = None
                                photo["_invalid_url"] = True
                            
                            ai_defects.append(photo)
                    
                    print(f"Filtered to {len(ai_defects)} AI-analyzed defects")
                    
                    def get_sort_key(photo):
                        uploaded_at = photo.get("uploaded_at")
                        if uploaded_at is None:
                            return ""
                        if hasattr(uploaded_at, 'isoformat'):
                            return uploaded_at.isoformat()
                        return str(uploaded_at)
                    
                    sorted_data = sorted(ai_defects, key=get_sort_key, reverse=True)
                    return sorted_data
                else:
                    print("No photos found for user")
                    return []
            except Exception as db_error:
                print(f"Error: Failed to fetch from Photo table: {db_error}")
                import traceback
                error_trace = traceback.format_exc()
                print(error_trace)
                raise HTTPException(status_code=500, detail=f"Database error fetching defects: {str(db_error)}. Check backend logs for details.")
        except HTTPException:
            raise
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Unexpected error in get_my_defects: {e}")
            print(error_trace)
            raise HTTPException(status_code=500, detail=f"Error fetching defects: {str(e)}")

