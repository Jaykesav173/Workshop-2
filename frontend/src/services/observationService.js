import axios from 'axios'
import { API_BASE } from './api.js'

const observationService = {
  /**
   * Create a new observation for an inspection
   */
  async createObservation(inspectionId, observationData, token) {
    const response = await axios.post(
      `${API_BASE}/inspections/${inspectionId}/observations`,
      observationData,
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
   * Get all observations for an inspection
   */
  async getObservations(inspectionId, token) {
    const response = await axios.get(
      `${API_BASE}/inspections/${inspectionId}/observations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.data
  },

  /**
   * Get a single observation by ID
   */
  async getObservation(observationId, token) {
    const response = await axios.get(
      `${API_BASE}/inspections/observations/${observationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.data
  },

  /**
   * Update an observation
   */
  async updateObservation(observationId, observationData, token) {
    const response = await axios.put(
      `${API_BASE}/inspections/observations/${observationId}`,
      observationData,
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
   * Delete an observation
   */
  async deleteObservation(observationId, token) {
    const response = await axios.delete(
      `${API_BASE}/inspections/observations/${observationId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    return response.data
  },
}

export default observationService

