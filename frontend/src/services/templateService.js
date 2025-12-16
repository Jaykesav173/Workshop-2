import axios from 'axios'
import { API_BASE } from './api.js'

const templateService = {
  /**
   * Get all finding templates
   * @param {string} token - Authentication token
   * @param {boolean} activeOnly - Whether to return only active templates
   * @returns {Promise<Array>} List of finding templates
   */
  async getFindingTemplates(token, activeOnly = true) {
    const response = await axios.get(`${API_BASE}/templates/findings?active_only=${activeOnly}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Get a single finding template by ID
   * @param {number} templateId - Template ID
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Finding template
   */
  async getFindingTemplate(templateId, token) {
    const response = await axios.get(`${API_BASE}/templates/findings/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Create a new finding template
   * @param {Object} template - Template data { label, text, is_active }
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Created template
   */
  async createFindingTemplate(template, token) {
    const response = await axios.post(`${API_BASE}/templates/findings`, template, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Update an existing finding template
   * @param {number} templateId - Template ID
   * @param {Object} template - Updated template data
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Updated template
   */
  async updateFindingTemplate(templateId, template, token) {
    const response = await axios.put(`${API_BASE}/templates/findings/${templateId}`, template, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Delete a finding template (soft delete)
   * @param {number} templateId - Template ID
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Success message
   */
  async deleteFindingTemplate(templateId, token) {
    const response = await axios.delete(`${API_BASE}/templates/findings/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Get all recommendation templates
   * @param {string} token - Authentication token
   * @param {boolean} activeOnly - Whether to return only active templates
   * @returns {Promise<Array>} List of recommendation templates
   */
  async getRecommendationTemplates(token, activeOnly = true) {
    const response = await axios.get(`${API_BASE}/templates/recommendations?active_only=${activeOnly}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Get a single recommendation template by ID
   * @param {number} templateId - Template ID
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Recommendation template
   */
  async getRecommendationTemplate(templateId, token) {
    const response = await axios.get(`${API_BASE}/templates/recommendations/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Create a new recommendation template
   * @param {Object} template - Template data { label, text, is_active }
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Created template
   */
  async createRecommendationTemplate(template, token) {
    const response = await axios.post(`${API_BASE}/templates/recommendations`, template, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Update an existing recommendation template
   * @param {number} templateId - Template ID
   * @param {Object} template - Updated template data
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Updated template
   */
  async updateRecommendationTemplate(templateId, template, token) {
    const response = await axios.put(`${API_BASE}/templates/recommendations/${templateId}`, template, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  /**
   * Delete a recommendation template (soft delete)
   * @param {number} templateId - Template ID
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Success message
   */
  async deleteRecommendationTemplate(templateId, token) {
    const response = await axios.delete(`${API_BASE}/templates/recommendations/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}

export default templateService

