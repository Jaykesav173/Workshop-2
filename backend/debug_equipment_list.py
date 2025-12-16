import asyncio
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

from app.routers.equipment.service_equipment import EquipmentService
from app.database.schemas import EquipmentResponse

async def main():
    service = EquipmentService()
    try:
        print("Fetching equipment list...")
        # We need to mock get_db or ensure it works. 
        # service_equipment.py imports get_db from app.database.connection
        # Let's hope it works without complex setup if env vars are set or defaults work.
        
        # Actually, get_all_equipment returns a list of EquipmentResponse objects.
        # The error likely happens during the conversion: [EquipmentResponse(**eq) for eq in equipment_list]
        
        # Let's try to fetch raw data first to see what we get
        res = service.db.table("equipment").select("*").order("id").execute()
        equipment_list = res.data if res.data else []
        print(f"Raw DB data count: {len(equipment_list)}")
        
        if equipment_list:
            print("First item raw:", equipment_list[0])
            
        # Now try the service method which does the conversion
        result = await service.get_all_equipment()
        print(f"Successfully fetched {len(result)} items via service.")
        
    except Exception as e:
        print(f"Error fetching equipment: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
