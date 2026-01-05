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
   * Get report by ID or inspection ID
   * @param {string|number} reportId - Report ID (UUID) or "inspection/{inspectionId}"
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
  },

  /**
   * Submit report for QA review
   * @param {string} reportId - Report ID
   * @returns {Promise} Updated report
   */
  async submitReport(reportId) {
    const response = await axios.post(
      `${API_BASE}/reports/${reportId}/submit`,
      {},
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Get submitted reports for QA review (for engineers)
   * @returns {Promise} List of submitted reports
   */
  async getSubmittedReports() {
    const response = await axios.get(
      `${API_BASE}/reports/submitted`,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Get all reports with all statuses (for dashboard statistics)
   * @returns {Promise} List of all reports
   */
  async getAllReports() {
    const response = await axios.get(
      `${API_BASE}/reports/all`,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Get QA comments for a report
   * @param {string} reportId - Report ID
   * @returns {Promise} List of QA comments
   */
  async getQAComments(reportId) {
    const response = await axios.get(
      `${API_BASE}/reports/${reportId}/qa-comments`,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Get QA comments for all reports of an inspection
   * @param {number} inspectionId - Inspection ID
   * @returns {Promise} List of QA comments
   */
  async getQACommentsByInspection(inspectionId) {
    const response = await axios.get(
      `${API_BASE}/reports/inspection/${inspectionId}/qa-comments`,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Add QA comment to a report
   * @param {string} reportId - Report ID
   * @param {Object} commentData - Comment data (section, comment)
   * @returns {Promise} Created comment
   */
  async addQAComment(reportId, commentData) {
    const response = await axios.post(
      `${API_BASE}/reports/${reportId}/qa-comments`,
      commentData,
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  /**
   * Approve or reject report (for engineers)
   * @param {string} reportId - Report ID
   * @param {string} action - 'approve' or 'reject'
   * @param {string} comment - Optional comment
   * @returns {Promise} Updated report
   */
  async reviewReport(reportId, action, comment = '') {
    const response = await axios.post(
      `${API_BASE}/reports/${reportId}/review`,
      { action, comment },
      { headers: getAuthHeaders() }
    )
    return response.data
  }
}

