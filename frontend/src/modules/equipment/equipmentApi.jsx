// frontend/src/modules/equipment/equipmentApi.jsx

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/equipment",
});

// -----------------------------------------------------
// 1. CREATE EQUIPMENT
// -----------------------------------------------------
export async function createEquipment(data, token) {
  return await API.post("/", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// -----------------------------------------------------
// 2. UPLOAD IMAGE
// -----------------------------------------------------
export async function uploadEquipmentImage(equipmentId, file, token) {
  const formData = new FormData();
  formData.append("file", file);

  return await API.post(`/${equipmentId}/upload-image`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
}

// -----------------------------------------------------
// 3. GET ALL EQUIPMENT
// -----------------------------------------------------
export async function getAllEquipment(token) {
  return await API.get("/", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// -----------------------------------------------------
// 4. GET EQUIPMENT BY ID
// -----------------------------------------------------
export async function getEquipmentById(id, token) {
  return await API.get(`/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

//Get dropdown list options
export async function getEquipmentOptions(token) {
  return await API.get("/options", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// -----------------------------------------------------
// 5. UPDATE EQUIPMENT
// -----------------------------------------------------
export async function updateEquipment(id, data, token) {
  return await API.put(`/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// -----------------------------------------------------
// 6. DELETE EQUIPMENT
// -----------------------------------------------------
export async function deleteEquipment(id, token) {
  return await API.delete(`/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
