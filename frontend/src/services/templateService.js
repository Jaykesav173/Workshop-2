/**
 * Template Service
 * API client for finding and recommendation templates
 */
import axios from 'axios'
import { API_BASE } from './api'

const templateService = {
  /**
   * Get finding templates
   * @param {boolean} activeOnly - Only return active templates
   * @returns {Promise<Array>} Array of finding templates
   */
  async getFindingTemplates(activeOnly = true) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/templates/findings`, {
        params: { activeOnly },
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data || []
    } catch (error) {
      console.error('Error fetching finding templates:', error)
      return []
    }
  },

  /**
   * Get recommendation templates
   * @param {boolean} activeOnly - Only return active templates
   * @returns {Promise<Array>} Array of recommendation templates
   */
  async getRecommendationTemplates(activeOnly = true) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/templates/recommendations`, {
        params: { activeOnly },
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data || []
    } catch (error) {
      console.error('Error fetching recommendation templates:', error)
      return []
    }
  },

  /**
   * Create a new finding template
   * @param {Object} data - Template data { label, text }
   * @returns {Promise<Object>} Created template
   */
  async createFindingTemplate(data) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE}/templates/findings`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    } catch (error) {
      console.error('Error creating finding template:', error)
      throw error
    }
  },

  /**
   * Create a new recommendation template
   * @param {Object} data - Template data { label, text }
   * @returns {Promise<Object>} Created template
   */
  async createRecommendationTemplate(data) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_BASE}/templates/recommendations`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    } catch (error) {
      console.error('Error creating recommendation template:', error)
      throw error
    }
  },

  /**
   * Update an existing finding template
   * @param {number} id - Template ID
   * @param {Object} data - Updated template data { label?, text?, is_active? }
   * @returns {Promise<Object>} Updated template
   */
  async updateFindingTemplate(id, data) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `${API_BASE}/templates/findings/${id}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    } catch (error) {
      console.error('Error updating finding template:', error)
      throw error
    }
  },

  /**
   * Update an existing recommendation template
   * @param {number} id - Template ID
   * @param {Object} data - Updated template data { label?, text?, is_active? }
   * @returns {Promise<Object>} Updated template
   */
  async updateRecommendationTemplate(id, data) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `${API_BASE}/templates/recommendations/${id}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    } catch (error) {
      console.error('Error updating recommendation template:', error)
      throw error
    }
  },

  /**
   * Delete a finding template (soft delete)
   * @param {number} id - Template ID
   * @returns {Promise<Object>} Success response
   */
  async deleteFindingTemplate(id) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(
        `${API_BASE}/templates/findings/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    } catch (error) {
      console.error('Error deleting finding template:', error)
      throw error
    }
  },

  /**
   * Delete a recommendation template (soft delete)
   * @param {number} id - Template ID
   * @returns {Promise<Object>} Success response
   */
  async deleteRecommendationTemplate(id) {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(
        `${API_BASE}/templates/recommendations/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      return response.data
    } catch (error) {
      console.error('Error deleting recommendation template:', error)
      throw error
    }
  }
}

export default templateService

