import axios from "axios";

// Base URL for the backend
const API_URL = "http://localhost:8000/api/report-review";

// Get all reports
export const getAllReports = (token) => {
    return axios.get(`${API_URL}/`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const getReportById = (id, token) => {
    return axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const submitReview = (data, token) => {
    return axios.post(`${API_URL}/review`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
