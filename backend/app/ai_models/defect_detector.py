# backend/app/ai_models/defect_detector.py
import json
import base64
from openai import OpenAI
from app.config import settings # Using absolute import for reliability

client = OpenAI(api_key=settings.OPENAI_API_KEY)

async def analyze_defect_image(image_bytes: bytes):
    # 1. Encode the bytes passed from the router
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    system_prompt = """
    You are a professional inspector. Analyze the provided image for vessel defects.
    Return your findings strictly in JSON format.

    For the bounding box (box_2d):
    - Use a normalized scale of 0 to 1000.
    - [0, 0] is top-left corner; [1000, 1000] is bottom-right corner.
    - Format: [ymin, xmin, ymax, xmax]

    Expected JSON structure:
    {
      "description": "Short technical description.",
      "recommendation": "Corrective action.",
      "category": "Corrosion/Structural/Coating/Other/None",
      "severity": "Low/Medium/High/Critical",
      "box_2d": [ymin, xmin, ymax, xmax]
    }
    
    CRITICAL RULE: If the surface is clean, set category to "None" and box_2d to [].
    """

    # 2. Call OpenAI API
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={ "type": "json_object" },
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": [
                {"type": "text", "text": "Analyze this vessel photo."},
                {
                    "type": "image_url", 
                    "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
                }
            ]}
        ]
    )

    # 3. Parse and return findings
    return json.loads(response.choices[0].message.content)