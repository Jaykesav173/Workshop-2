/**
 * Photo Upload Service
 * Handles photo upload operations
 */
import axios from 'axios'
import { API_BASE } from './api.js'
import { isValidImageUrl, getSafeImageUrl } from '../utils/imageUtils'

export const photoService = {
  /**
   * Upload a photo
   * @param {File} file - The photo file to upload
   * @param {number|null} equipmentId - Optional equipment ID to link the photo
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Upload response with photo data
   */
  async uploadPhoto(file, equipmentId = null, token) {
    const formData = new FormData()
    formData.append('file', file)
    if (equipmentId) {
      formData.append('equipment_id', equipmentId)
    }

    const response = await axios.post(
      `${API_BASE}/photos/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Get all photos for an equipment
   * @param {number} equipmentId - Equipment ID
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} List of photos
   */
  async getEquipmentPhotos(equipmentId, token) {
    const response = await axios.get(
      `${API_BASE}/photos/equipment/${equipmentId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.data || []
  },

  /**
   * Get photo by ID
   * @param {number} photoId - Photo ID
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Photo data
   */
  async getPhoto(photoId, token) {
    const response = await axios.get(
      `${API_BASE}/photos/${photoId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.data
  },

  /**
   * Delete a photo
   * @param {number} photoId - Photo ID
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Delete response
   */
  async deletePhoto(photoId, token) {
    const response = await axios.delete(
      `${API_BASE}/photos/${photoId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.data
  },

  /**
   * Get photo file URL - prefers Supabase Storage URL, falls back to API endpoint
   * @param {number} photoId - Photo ID
   * @param {string|null} storageUrl - Optional storage_url from photo object
   * @returns {string} Photo file URL (validated HTTPS URL)
   */
  getPhotoFileUrl(photoId, storageUrl = null) {
    // If storage_url is provided and valid, use it
    if (storageUrl && isValidImageUrl(storageUrl)) {
      return storageUrl;
    }
    // Fallback to API endpoint (which should serve files or redirect to Supabase)
    return `${API_BASE}/photos/${photoId}/file`;
  },
  
  /**
   * Get safe image URL for rendering - validates and sanitizes URLs
   * @param {Object} photo - Photo object with storage_url or id
   * @returns {string} Safe HTTPS URL for image rendering
   */
  getSafePhotoUrl(photo) {
    if (!photo) {
      return null;
    }
    
    // Prefer storage_url if valid
    if (photo.storage_url && isValidImageUrl(photo.storage_url)) {
      return photo.storage_url;
    }
    
    // Fallback to API endpoint if photo has an ID
    if (photo.id || photo.photo_id) {
      return this.getPhotoFileUrl(photo.id || photo.photo_id);
    }
    
    // No valid URL available
    return null;
  },

  /**
   * Link photo to inspection with group number
   * @param {number} inspectionId - Inspection ID
   * @param {number} photoId - Photo ID
   * @param {number} groupNumber - Group number (1, 2, 3, etc.)
   * @param {string} photoNumber - Photo number (e.g., "1.1", "1.2")
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Link response
   */
  async linkPhotoToInspection(inspectionId, photoId, groupNumber, photoNumber = null, token) {
    const response = await axios.post(
      `${API_BASE}/inspections/${inspectionId}/photos/link`,
      {
        photo_id: photoId,
        group_number: groupNumber,
        photo_number: photoNumber,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  },

  /**
   * Get all photos for an inspection with group numbers
   * @param {number} inspectionId - Inspection ID
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} List of photos with group numbers
   */
  async getInspectionPhotos(inspectionId, token) {
    const response = await axios.get(
      `${API_BASE}/inspections/${inspectionId}/photos`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.data || []
  },

  /**
   * Update finding key for a photo in an inspection
   * @param {number} inspectionId - Inspection ID
   * @param {number} photoId - Photo ID
   * @param {string} findingKey - Finding key (e.g., "1.1", "2.3")
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Update response
   */
  async updatePhotoFindingKey(inspectionId, photoId, findingKey, token) {
    const response = await axios.patch(
      `${API_BASE}/inspections/${inspectionId}/photos/${photoId}/finding-key`,
      {
        finding_key: findingKey,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  },

  /**
   * Remove photo link from inspection
   * @param {number} inspectionId - Inspection ID
   * @param {number} photoId - Photo ID
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Delete response
   */
  async deleteInspectionPhotoLink(inspectionId, photoId, token) {
    const response = await axios.delete(
      `${API_BASE}/inspections/${inspectionId}/photos/${photoId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.data
  }
}

