"""
Observation Service - Asillah (Inspection Workflow)
Business logic for observation CRUD operations
"""
from fastapi import HTTPException
from app.database.connection import get_db
from app.database.schemas import ObservationCreate, ObservationResponse, FindingBase, RecommendationBase
from typing import List

class ObservationService:
    def __init__(self):
        self.db = get_db()
    
    async def create_observation(self, observation: ObservationCreate) -> ObservationResponse:
        """Create new observation with findings and recommendations"""
        try:
            # Insert observation
            observation_data = {
                "inspection_id": observation.inspection_id,
                "component": observation.component,
                "location": observation.location,
                "observation_type": observation.observation_type,
                "severity": observation.severity,
                "status": observation.status,
                "priority": observation.priority,
                "action_required": observation.action_required,
            }
            
            res = self.db.table("Observation").insert(observation_data).execute()
            if not res.data:
                raise HTTPException(status_code=500, detail="Failed to create observation")
            
            observation_id = res.data[0]["observation_id"]
            
            # Insert findings
            if observation.findings:
                findings_data = [
                    {
                        "observation_id": observation_id,
                        "finding_key": f.key,
                        "finding_text": f.text
                    }
                    for f in observation.findings
                ]
                self.db.table("Finding").insert(findings_data).execute()
            
            # Insert recommendations
            if observation.recommendations:
                recommendations_data = [
                    {
                        "observation_id": observation_id,
                        "recommendation_key": r.key,
                        "recommendation_text": r.text
                    }
                    for r in observation.recommendations
                ]
                self.db.table("Recommendation").insert(recommendations_data).execute()
            
            # Fetch complete observation with findings and recommendations
            return await self.get_observation(observation_id)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating observation: {str(e)}")
    
    async def get_observations_by_inspection(self, inspection_id: int) -> List[ObservationResponse]:
        """Get all observations for an inspection"""
        try:
            # Get observations
            obs_res = self.db.table("Observation").select("*").eq("inspection_id", inspection_id).order("observation_id").execute()
            
            if not obs_res.data:
                return []
            
            observations = []
            for obs in obs_res.data:
                observation_id = obs["observation_id"]
                
                # Get findings
                findings_res = self.db.table("Finding").select("*").eq("observation_id", observation_id).order("finding_key").execute()
                findings = [
                    FindingBase(key=f["finding_key"], text=f["finding_text"])
                    for f in findings_res.data or []
                ]
                
                # Get recommendations
                recs_res = self.db.table("Recommendation").select("*").eq("observation_id", observation_id).order("recommendation_key").execute()
                recommendations = [
                    RecommendationBase(key=r["recommendation_key"], text=r["recommendation_text"])
                    for r in recs_res.data or []
                ]
                
                observations.append(ObservationResponse(
                    observation_id=observation_id,
                    inspection_id=obs["inspection_id"],
                    component=obs["component"],
                    location=obs.get("location"),
                    observation_type=obs.get("observation_type"),
                    severity=obs.get("severity"),
                    status=obs.get("status", "OPEN"),
                    priority=obs.get("priority", "MEDIUM"),
                    action_required=obs.get("action_required"),
                    findings=findings,
                    recommendations=recommendations,
                    created_at=obs["created_at"],
                    updated_at=obs["updated_at"]
                ))
            
            return observations
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching observations: {str(e)}")
    
    async def get_observation(self, observation_id: int) -> ObservationResponse:
        """Get observation by ID with findings and recommendations"""
        try:
            # Get observation
            obs_res = self.db.table("Observation").select("*").eq("observation_id", observation_id).execute()
            if not obs_res.data:
                raise HTTPException(status_code=404, detail="Observation not found")
            
            obs = obs_res.data[0]
            
            # Get findings
            findings_res = self.db.table("Finding").select("*").eq("observation_id", observation_id).order("finding_key").execute()
            findings = [
                FindingBase(key=f["finding_key"], text=f["finding_text"])
                for f in findings_res.data or []
            ]
            
            # Get recommendations
            recs_res = self.db.table("Recommendation").select("*").eq("observation_id", observation_id).order("recommendation_key").execute()
            recommendations = [
                RecommendationBase(key=r["recommendation_key"], text=r["recommendation_text"])
                for r in recs_res.data or []
            ]
            
            return ObservationResponse(
                observation_id=obs["observation_id"],
                inspection_id=obs["inspection_id"],
                component=obs["component"],
                location=obs.get("location"),
                observation_type=obs.get("observation_type"),
                severity=obs.get("severity"),
                status=obs.get("status", "OPEN"),
                priority=obs.get("priority", "MEDIUM"),
                action_required=obs.get("action_required"),
                findings=findings,
                recommendations=recommendations,
                created_at=obs["created_at"],
                updated_at=obs["updated_at"]
            )
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching observation: {str(e)}")
    
    async def update_observation(self, observation_id: int, observation: ObservationCreate) -> ObservationResponse:
        """Update observation and its findings/recommendations"""
        try:
            # Update observation
            observation_data = {
                "component": observation.component,
                "location": observation.location,
                "observation_type": observation.observation_type,
                "severity": observation.severity,
                "status": observation.status,
                "priority": observation.priority,
                "action_required": observation.action_required,
            }
            
            res = self.db.table("Observation").update(observation_data).eq("observation_id", observation_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Observation not found")
            
            # Delete existing findings and recommendations
            self.db.table("Finding").delete().eq("observation_id", observation_id).execute()
            self.db.table("Recommendation").delete().eq("observation_id", observation_id).execute()
            
            # Insert new findings
            if observation.findings:
                findings_data = [
                    {
                        "observation_id": observation_id,
                        "finding_key": f.key,
                        "finding_text": f.text
                    }
                    for f in observation.findings
                ]
                self.db.table("Finding").insert(findings_data).execute()
            
            # Insert new recommendations
            if observation.recommendations:
                recommendations_data = [
                    {
                        "observation_id": observation_id,
                        "recommendation_key": r.key,
                        "recommendation_text": r.text
                    }
                    for r in observation.recommendations
                ]
                self.db.table("Recommendation").insert(recommendations_data).execute()
            
            # Return updated observation
            return await self.get_observation(observation_id)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating observation: {str(e)}")
    
    async def delete_observation(self, observation_id: int) -> dict:
        """Delete observation (findings and recommendations cascade delete)"""
        try:
            res = self.db.table("Observation").delete().eq("observation_id", observation_id).execute()
            if not res.data:
                raise HTTPException(status_code=404, detail="Observation not found")
            
            return {"success": True, "message": "Observation deleted successfully"}
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting observation: {str(e)}")

