import axios from 'axios'
import { API_BASE } from './api'

const templateService = {
  // Finding Templates
  async getFindingTemplates(activeOnly = true) {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE}/templates/findings`, {
      params: { active_only: activeOnly },
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async createFindingTemplate(template) {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_BASE}/templates/findings`, template, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async updateFindingTemplate(templateId, template) {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_BASE}/templates/findings/${templateId}`, template, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async deleteFindingTemplate(templateId) {
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_BASE}/templates/findings/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  // Recommendation Templates
  async getRecommendationTemplates(activeOnly = true) {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE}/templates/recommendations`, {
      params: { active_only: activeOnly },
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async createRecommendationTemplate(template) {
    const token = localStorage.getItem('token')
    const response = await axios.post(`${API_BASE}/templates/recommendations`, template, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async updateRecommendationTemplate(templateId, template) {
    const token = localStorage.getItem('token')
    const response = await axios.put(`${API_BASE}/templates/recommendations/${templateId}`, template, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  },

  async deleteRecommendationTemplate(templateId) {
    const token = localStorage.getItem('token')
    const response = await axios.delete(`${API_BASE}/templates/recommendations/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return response.data
  }
}

export default templateService

