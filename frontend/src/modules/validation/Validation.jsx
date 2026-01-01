/**
 * Report Review and Quality Assurance Module
 */

import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllReports } from "./validationApi";
import { useNavigate } from "react-router-dom";

export default function Validation() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Advanced Filter States
    const [filterCategory, setFilterCategory] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [activeFilters, setActiveFilters] = useState([]);

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await getAllReports(token);
            setReports(res.data);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get unique options for the value dropdown
    const getFilterOptions = () => {
        if (!filterCategory) return [];

        if (filterCategory === "status") {
            return ["Approved", "Rejected", "Continue Review"];
        }

        const uniqueValues = new Set(reports.map(r => {
            if (filterCategory === "inspection_date") {
                if (!r.inspection_date) return "N/A";
                // Convert to "Month Year" format (e.g., "December 2025")
                const date = new Date(r.inspection_date);
                return date.toLocaleString('default', { month: 'long', year: 'numeric' });
            }
            return r[filterCategory] || "N/A";
        }));
        return Array.from(uniqueValues).sort();
    };

    // Filter logic
    const filteredReports = reports.filter((report) => {
        // 1. Text Search
        const query = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || (
            (report.report_title && report.report_title.toLowerCase().includes(query)) ||
            (report.equipment_tag && report.equipment_tag.toLowerCase().includes(query)) ||
            (report.equipment_location && report.equipment_location.toLowerCase().includes(query)) ||
            (report.inspector_name && report.inspector_name.toLowerCase().includes(query))
        );

        if (!matchesSearch) return false;

        // 2. Active Dropdown Filters
        if (activeFilters.length === 0) return true;

        return activeFilters.every(filter => {
            if (filter.category === "inspection_date") {
                if (!report.inspection_date) return filter.value === "N/A";
                const date = new Date(report.inspection_date);
                const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return monthYear === filter.value;
            }
            if (filter.category === "status") {
                const status = report.status ? report.status.toUpperCase() : 'COMPLETED';
                if (filter.value === "Approved") return status === 'APPROVED';
                if (filter.value === "Rejected") return status === 'REJECTED - NEED REVISIONS' || status === 'NEEDS REVISION' || status === 'REJECTED';
                if (filter.value === "Continue Review") return status === 'IN_PROGRESS';
                return false;
            }
            const itemValue = report[filter.category];
            return (itemValue || "N/A") === filter.value;
        });
    });

    const categories = [
        { value: "inspection_date", label: "Inspection Date" },
        { value: "inspector_name", label: "Inspector Name" },
        { value: "equipment_tag", label: "Equipment Name" },
        { value: "equipment_location", label: "Equipment Location" },
        { value: "status", label: "Status" }
    ];

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterCategory, filterValue, activeFilters]);

    // Helper to highlight text
    const highlightText = (text, query) => {
        if (!query) return text;
        if (!text) return "";

        const parts = text.toString().split(new RegExp(`(${query})`, "gi"));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-200 font-bold">{part}</span>
            ) : (
                part
            )
        );
    };

    return (
        <div className="bg-white min-h-screen w-full font-sans text-black">
            <div className="p-8">
                <h1 className="text-3xl font-bold mb-6">Report Validation</h1>

                {/* Search Bar */}
                <div className="bg-[#e9e9e9] p-4 rounded-lg mb-6 flex flex-col gap-4">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="search bar"
                            className="pl-10 pr-4 py-2 w-full bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    {/* Filter Category Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-l text-black bg-white">Filtered by:</span>
                        <select
                            value={filterCategory}
                            onChange={(e) => {
                                setFilterCategory(e.target.value);
                                setFilterValue(""); // Reset value on category change
                            }}
                            className="px-4 py-2 bg-gray-300 text-black text-l rounded-full border-none focus:ring-2 focus:ring-gray-400 cursor-pointer outline-none"
                        >
                            <option value="">Select your filter here</option>
                            {categories.map(c => (
                                <option key={c.value} value={c.value} disabled={activeFilters.some(f => f.category === c.value)}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Value Dropdown */}
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-l text-black bg-white">Value:</span>
                        <select
                            value={filterValue}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFilterValue(val);
                                if (val && filterCategory) {
                                    // Add to active filters
                                    if (!activeFilters.some(f => f.category === filterCategory && f.value === val)) {
                                        setActiveFilters([...activeFilters, { category: filterCategory, value: val }]);
                                    }
                                    // Reset selection to allow adding more
                                    setFilterCategory("");
                                    setFilterValue("");
                                }
                            }}
                            disabled={!filterCategory}
                            className="px-4 py-2 bg-gray-300 text-black text-l rounded-full border-none focus:ring-2 focus:ring-gray-400 cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Select the value here</option>
                            {getFilterOptions().map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Active Filters Display */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {activeFilters.map((filter, index) => (
                        <div key={index} className="flex items-center gap-2 px-4 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-base font-medium tracking-wider">
                            <span>
                                {categories.find(c => c.value === filter.category)?.label}: {filter.value}
                            </span>
                            <button
                                onClick={() => setActiveFilters(activeFilters.filter((_, i) => i !== index))}
                                className="hover:text-red-600 font-bold ml-1"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    {activeFilters.length > 0 && (
                        <button
                            onClick={() => setActiveFilters([])}
                            className="text-sm text-red-600 hover:underline self-center ml-2"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-[#d1d5db]">
                            <tr>
                                {/* Removed 'Date' column as requested */}
                                <th className="py-3 px-4 text-center font-bold text-black border-b border-gray-300">Report Title</th>
                                <th className="py-3 px-4 text-center font-bold text-black border-b border-gray-300">Inspection Date</th>
                                <th className="py-3 px-4 text-center font-bold text-black border-b border-gray-300">Inspector Name</th>
                                <th className="py-3 px-4 text-center font-bold text-black border-b border-gray-300">Equipment name</th>
                                <th className="py-3 px-4 text-center font-bold text-black border-b border-gray-300">Equipment location</th>
                                <th className="py-3 px-4 text-center font-bold text-black border-b border-gray-300">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">Loading reports...</td>
                                </tr>
                            ) : paginatedReports.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-500">No reports found.</td>
                                </tr>
                            ) : (
                                paginatedReports.map((report) => (
                                    <tr key={report.report_id} className="hover:bg-gray-50 border-b border-gray-200">
                                        <td className="py-3 px-4 font-medium text-center">{highlightText(report.report_title || "Untitled", searchQuery)}</td>
                                        <td className="py-3 px-4 text-center">
                                            {highlightText(report.inspection_date ? new Date(report.inspection_date).toLocaleDateString("en-GB").replace(/\//g, "-") : "-", searchQuery)}
                                        </td>
                                        <td className="py-3 px-4 text-center">{highlightText(report.inspector_name || "-", searchQuery)}</td>
                                        <td className="py-3 px-4 text-center">{highlightText(report.equipment_tag || "-", searchQuery)}</td>
                                        <td className="py-3 px-4 text-center">{highlightText(report.equipment_location || "-", searchQuery)}</td>
                                        <td className="py-3 px-4 text-center">
                                            {(() => {
                                                const status = report.status ? report.status.toUpperCase() : 'COMPLETED';

                                                if (status === 'APPROVED') {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Approved
                                                        </span>
                                                    );
                                                } else if (status === 'IN_PROGRESS') {
                                                    return (
                                                        <button
                                                            onClick={() => navigate(`/validation/${report.report_id}`)}
                                                            className="inline-flex items-center px-4 py-1 rounded-md text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200"
                                                        >
                                                            Continue Review
                                                        </button>
                                                    );
                                                } else if (status === 'REJECTED - NEED REVISIONS' || status === 'NEEDS REVISION' || status === 'REJECTED') {
                                                    return (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Rejected - Need Revisions
                                                        </span>
                                                    );
                                                } else {
                                                    // COMPLETED, DRAFT, etc.
                                                    return (
                                                        <button
                                                            onClick={() => navigate(`/validation/${report.report_id}`)}
                                                            className="bg-blue-600 text-white px-4 py-1 rounded text-sm font-semibold hover:bg-blue-700"
                                                        >
                                                            Review
                                                        </button>
                                                    );
                                                }
                                            })()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && filteredReports.length > 0 && (
                    <div className="flex justify-between items-center mt-4 px-4">
                        <div className="text-sm text-gray-600">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-medium text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-1 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
