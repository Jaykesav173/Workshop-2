import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, User, MapPin, Tag, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getReportById, submitReview, fetchReportPDF } from "./validationApi";

export default function ValidationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // PDF State
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState(null);

    const token = localStorage.getItem("token");

    // Feedback State
    const [feedbackItems, setFeedbackItems] = useState([]);
    const [isAddingFeedback, setIsAddingFeedback] = useState(false);
    const [newFeedback, setNewFeedback] = useState({
        section: "",
        issue: "",
        customComment: "",
        labelId: ""
    });

    const handleAddFeedback = () => {
        if (!newFeedback.section || !newFeedback.issue) return;

        let finalComment = newFeedback.customComment;
        // Prepend Label ID if exists
        if (newFeedback.labelId) {
            finalComment = `(Ref: ${newFeedback.labelId}) ${finalComment}`;
        }

        setFeedbackItems([...feedbackItems, { ...newFeedback, customComment: finalComment, id: Date.now() }]);
        setIsAddingFeedback(false);
        setNewFeedback({ section: "", issue: "", customComment: "", labelId: "" });
    };

    const removeFeedback = (id) => {
        setFeedbackItems(feedbackItems.filter(item => item.id !== id));
    };

    const handleSubmitReview = async (status) => {
        let confirmMessage = "";
        if (status === "Approved") {
            confirmMessage = "Are you sure you want to APPROVE this report?";
        } else if (status === "Rejected") {
            confirmMessage = "Are you sure you want to REJECT this report?";
        } else if (status === "In Progress") {
            confirmMessage = "Are you sure you want to stop reviewing and save the progress?";
        }

        if (!confirm(confirmMessage)) return;

        try {
            setLoading(true);
            const payload = {
                report_id: id,
                status: status,
                feedback_items: feedbackItems.map(item => ({
                    section_name: item.section,
                    feedback: `${item.issue}${item.customComment ? ': ' + item.customComment : ''}`
                }))
            };

            await submitReview(payload, token);
            alert("Review submitted successfully!");
            navigate("/validation");
        } catch (error) {
            console.error("Failed to submit review", error);
            alert("Failed to submit review. Please try again.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        loadPdf();

        // Cleanup PDF URL on unmount
        return () => {
            if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
        };
    }, [id]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const res = await getReportById(id, token);
            setReport(res.data);

            // Load existing feedback if any
            if (res.data.feedback_items && res.data.feedback_items.length > 0) {
                const loadedFeedback = res.data.feedback_items.map(item => {
                    // split feedback "Issue: Comment"
                    const parts = item.feedback.split(': ');
                    const issue = parts[0];
                    const comment = parts.length > 1 ? parts.slice(1).join(': ') : "";

                    return {
                        id: item.feedback_id || Date.now() + Math.random(),
                        section: item.section_name,
                        issue: issue,
                        customComment: comment
                    };
                });
                setFeedbackItems(loadedFeedback);
            }
        } catch (err) {
            console.error("Failed to fetch report detail", err);
            setError("Failed to load report. It may not exist.");
        } finally {
            setLoading(false);
        }
    };

    const loadPdf = async () => {
        try {
            setPdfLoading(true);
            setPdfError(null);
            const res = await fetchReportPDF(id, token);
            console.log("📄 PDF Response Type:", res.data.type);
            console.log("📄 PDF Blob Size:", res.data.size);

            // res.data is already a Blob if axios responseType is 'blob'
            const blob = res.data;
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
        } catch (err) {
            console.error("Failed to load PDF", err);
            setPdfError("PDF not available yet or failed to load.");
        } finally {
            setPdfLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-xl text-gray-600 font-semibold animate-pulse">Loading Report...</div>
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
                <div className="text-xl text-red-500 font-semibold">{error || "Report not found"}</div>
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    <ArrowLeft size={20} /> Go Back
                </button>
            </div>
        );
    }

    // Parse content if it's a string, otherwise use as is
    let parsedContent = {};
    try {
        parsedContent = typeof report.content === "string" ? JSON.parse(report.content) : report.content;
    } catch (e) {
        parsedContent = {}; // Fallback
    }

    // Parse labeled photos
    let parsedPhotos = [];
    try {
        parsedPhotos = typeof report.labeled_photos === "string" ? JSON.parse(report.labeled_photos) : (report.labeled_photos || []);
    } catch (e) {
        parsedPhotos = [];
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center overflow-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate("/validation")}
                className="fixed top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white shadow-md rounded-full text-gray-700 hover:bg-gray-50 transition-colors z-10"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to List</span>
            </button>

            {/* A4 Paper Container */}
            <div
                className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] relative animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col"
                style={{ aspectRatio: "210/297" }} // Maintains A4 ratio
            >
                {/* Header (Only show if PDF failed or loading, otherwise iframe covers it) */}
                {(!pdfUrl || pdfLoading) && (
                    <div className="p-[20mm] pb-0">
                        <div className="border-b-4 border-blue-600 pb-6 mb-8 flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.report_title}</h1>
                                <p className="text-sm text-gray-500 font-mono">ID: {report.report_id}</p>
                            </div>
                            <div className="text-right">
                                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold mb-1">
                                    {report.status}
                                </div>
                                <p className="text-sm text-gray-500">{report.report_type || "Inspection Report"}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* PDF Viewer */}
                <div className="flex-grow flex flex-col relative h-full">
                    {pdfLoading ? (
                        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500 font-medium">Loading PDF...</p>
                        </div>
                    ) : pdfUrl ? (
                        <object
                            data={pdfUrl}
                            type="application/pdf"
                            className="w-full h-full absolute inset-0"
                            title="Report PDF"
                        >
                            <div className="flex flex-col items-center justify-center h-full">
                                <p className="text-gray-500 mb-2">Unable to display PDF directly.</p>
                                <a
                                    href={pdfUrl}
                                    download={`Report_${report.report_no || id}.pdf`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Download PDF
                                </a>
                                <button
                                    onClick={() => window.open(pdfUrl, '_blank')}
                                    className="px-4 py-2 mt-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Open in New Tab
                                </button>
                            </div>
                        </object>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[200mm] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 m-[20mm] mt-0">
                            <div className="text-center p-8">
                                <AlertCircle size={64} className="mx-auto mb-4 text-red-400" />
                                <h2 className="text-2xl font-bold text-gray-700 mb-2">PDF Not Available</h2>
                                <p className="text-gray-500 mb-6 max-w-md">
                                    {pdfError || "The PDF for this report could not be loaded."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Changes Needed / Feedback Section */}
            <div className="w-full max-w-[210mm] mt-8 bg-transparent">
                <h3 className="text-xl font-bold text-black mb-4 border-b-2 border-black inline-block text-[15px]">Changes needed</h3>

                <div className="flex flex-wrap gap-4">
                    {/* List of Added Feedback Cards */}
                    {feedbackItems.map((item) => (
                        <div key={item.id} className="w-[300px] h-[200px] bg-gray-200 border border-gray-400 p-4 flex flex-col justify-between shadow-sm relative group">
                            <button
                                onClick={() => removeFeedback(item.id)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                &times;
                            </button>
                            <div className="space-y-2">
                                <div className="bg-gray-300 px-3 py-1 text-sm font-semibold text-gray-800 rounded">
                                    {item.section}
                                </div>
                                <div className="bg-gray-300 px-3 py-1 text-sm font-medium text-gray-700 rounded">
                                    {item.issue}
                                </div>
                                {item.customComment && (
                                    <div className="mt-2 text-sm text-gray-600 italic bg-white p-2 rounded h-[70px] overflow-y-auto border border-gray-300">
                                        "{item.customComment}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add Feedback Input Card */}
                    {isAddingFeedback ? (
                        <div className="w-[300px] h-[200px] bg-gray-200 border border-gray-400 p-4 flex flex-col gap-2 shadow-sm">
                            <select
                                className="w-full p-2 text-sm border border-gray-300 rounded bg-white"
                                value={newFeedback.section}
                                onChange={(e) => setNewFeedback({ ...newFeedback, section: e.target.value })}
                            >
                                <option value="" disabled>Select Section</option>
                                {FEEDBACK_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>

                            {/* Conditional Label ID Input for Findings/Photos */}
                            {(newFeedback.section === "Description of Findings" ||
                                newFeedback.section === "Photo Evidence" ||
                                newFeedback.section === "Methods of Inspection" ||
                                newFeedback.section === "Start-up / Shut-down Recommendation") && (
                                    <input
                                        type="text"
                                        className="w-full p-2 text-sm border border-gray-300 rounded bg-white"
                                        placeholder="Ref ID (e.g., 1.1, 1.2)..."
                                        value={newFeedback.labelId || ""}
                                        onChange={(e) => setNewFeedback({ ...newFeedback, labelId: e.target.value })}
                                    />
                                )}

                            <select
                                className="w-full p-2 text-sm border border-gray-300 rounded bg-white"
                                value={newFeedback.issue}
                                onChange={(e) => setNewFeedback({ ...newFeedback, issue: e.target.value })}
                                disabled={!newFeedback.section}
                            >
                                <option value="" disabled>Select Issue</option>
                                {FEEDBACK_ISSUES.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>

                            {newFeedback.issue === "Other" && (
                                <textarea
                                    className="w-full p-2 text-sm border border-gray-300 rounded bg-white resize-none flex-grow"
                                    placeholder="Enter your comment..."
                                    value={newFeedback.customComment}
                                    onChange={(e) => setNewFeedback({ ...newFeedback, customComment: e.target.value })}
                                />
                            )}

                            <div className="flex justify-end gap-2 mt-auto">
                                <button
                                    onClick={() => setIsAddingFeedback(false)}
                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddFeedback}
                                    disabled={!newFeedback.section || !newFeedback.issue}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Huge Plus Button */
                        <button
                            onClick={() => {
                                setIsAddingFeedback(true);
                                setNewFeedback({ section: "", issue: "", customComment: "", labelId: "" });
                            }}
                            className="w-[300px] h-[200px] bg-white border border-black flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                            <span className="text-[100px] leading-none font-light pb-4">+</span>
                            <span className="text-lg font-semibold text-black">Click to add comments</span>
                        </button>
                    )}
                </div>
            </div>
            {/* Action Buttons */}
            <div className="w-full max-w-[210mm] mt-8 mb-16 flex justify-end gap-4">
                <button
                    onClick={() => handleSubmitReview("In Progress")}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-xl shadow-md hover:bg-yellow-600 transition-all font-semibold"
                >
                    <FileText size={20} />
                    Save Progress
                </button>
                <button
                    onClick={() => handleSubmitReview("Rejected")}
                    disabled={feedbackItems.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                    title={feedbackItems.length === 0 ? "Add changes needed first" : "Submit Rejection"}
                >
                    <XCircle size={20} />
                    Reject / Request Changes
                </button>

                <button
                    onClick={() => handleSubmitReview("Approved")}
                    disabled={feedbackItems.length > 0}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                    title={feedbackItems.length > 0 ? "Cannot approve with pending changes" : "Approve Report"}
                >
                    <CheckCircle size={20} />
                    Approve Report
                </button>
            </div>
        </div >
    );
}

const FEEDBACK_SECTIONS = [
    "Report Header",
    "Client Details",
    //"Methods of Inspection",
    "Description of Findings",
    "Recommendation",
    "Photo Evidence",
    "General"
];

const FEEDBACK_ISSUES = [
    "Spelling/Grammar Error",
    "Incorrect Information",
    "Wrong Classification",
    "Missing/Incomplete Details",
    "Photo Mismatch",
    "Not Clear",
    "Other"
];
