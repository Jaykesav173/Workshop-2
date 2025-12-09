/**
 * Report Service
 * API service for report generation endpoints
 */
import axios from 'axios'
import { API_BASE } from './api.js'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

export const reportService = {
  /**
   * Generate API-510 report
   * @param {Object} reportData - Report data structure
   * @returns {Promise} Generated report
   */
  async generateReport(reportData) {
    const response = await axios.post(
      `${API_BASE}/reports/generate`,
      reportData,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Get report by ID
   * @param {number} reportId - Report ID
   * @returns {Promise} Report data
   */
  async getReport(reportId) {
    const response = await axios.get(
      `${API_BASE}/reports/${reportId}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Export report PDF
   * @param {number} reportId - Report ID
   * @param {string} token - Auth token
   * @returns {Promise<Blob>} PDF blob
   */
  async exportPDF(reportId, token) {
    const response = await axios.get(
      `${API_BASE}/reports/${reportId}/export-pdf`,
      { 
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'blob'
      }
    )
    return response.data
  },

  /**
   * Get all reports for an equipment
   * @param {number} equipmentId - Equipment ID
   * @returns {Promise} List of reports
   */
  async getEquipmentReports(equipmentId) {
    const response = await axios.get(
      `${API_BASE}/reports/equipment/${equipmentId}`,
      { headers: getAuthHeaders() }
    )
    return response.data
  }
}


