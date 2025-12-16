// frontend/src/modules/equipment/equipmentApi.jsx

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api/equipment",
});

// Create equipment function
export async function createEquipment(data, token) {
  return await API.post("/", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Upload equipment image (general view) function
export async function uploadEquipmentImage(equipmentId, file, token, partView = "General") {
  console.log(`[API] uploadEquipmentImage called. ID: ${equipmentId}, PartView Arg: "${partView}"`);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("part_view", partView);

  // Log FormData keys
  for (var pair of formData.entries()) {
    console.log('[API] FormData ' + pair[0] + ', ' + pair[1]);
  }

  return await API.post(`/${equipmentId}/upload-image`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
}

// Get equipment information function
export async function getAllEquipment(token) {
  return await API.get("/", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Get equipment by ID function
export async function getEquipmentById(id, token) {
  return await API.get(`/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Get dropdown list options function
export async function getEquipmentOptions(token) {
  return await API.get("/options", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Get unique part views function
export async function getPartViewOptions(token) {
  return await API.get("/part-views", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Get material options function
export async function getMaterialOptions(token) {
  return await API.get("/material-options", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Edit and update equipment information function
export async function updateEquipment(id, data, token) {
  return await API.put(`/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Delete equipment function
export async function deleteEquipment(id, token) {
  return await API.delete(`/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
