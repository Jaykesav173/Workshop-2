/**
 * Review Inspection Page
 * For engineers to review submitted reports and add QA comments
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { reportService } from '../../services/reportService'

// Icons Component Definition
const Icons = {
  Download: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ReviewInspection() {
  const navigate = useNavigate()
  const { reportId } = useParams() // Get ID from URL

  // State
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)

  // Additional state items that were missing
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [qaComments, setQAComments] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState({ section: '', comment: '' })

  // Check authentication
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (!token) { navigate('/login'); return }
      if (userStr) {
        const user = JSON.parse(userStr)
        if (user.role?.toUpperCase() !== 'ENGINEER') {
          alert('Access denied. This page is for engineers only.')
          navigate('/inspector/dashboard')
          return
        }
      }

      try {
        setLoading(true)
        const reportsData = await reportService.getSubmittedReports()
        setReports(reportsData)

        // Deep Linking Logic
        if (reportId && reportsData.length > 0) {
          const targetReport = reportsData.find(r =>
            (r.report_id && r.report_id.toString() === reportId) ||
            (r.id && r.id.toString() === reportId)
          )
          if (targetReport) {
            handleSelectReport(targetReport)
          }
        }
      } catch (err) {
        console.error('Error fetching submitted reports:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [navigate, reportId])

  const fetchSubmittedReports = async () => {
    try {
      setLoading(true)
      const reportsData = await reportService.getSubmittedReports()
      setReports(reportsData)
    } catch (err) {
      console.error('Error fetching submitted reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchQAComments = async (reportId) => {
    try {
      const comments = await reportService.getQAComments(reportId)
      setQAComments(comments)
    } catch (err) {
      console.error('Error fetching QA comments:', err)
      setQAComments([])
    }
  }

  const handleSelectReport = async (report) => {
    setSelectedReport(report)
    await fetchQAComments(report.report_id || report.id)
    // Load PDF for viewing
    await loadPDFForViewing(report.report_id || report.id)
  }

  const loadPDFForViewing = async (reportId) => {
    try {
      setLoadingPdf(true)
      const token = localStorage.getItem('token')
      // Fetch PDF as blob
      const blob = await reportService.exportPDF(reportId, token)
      // Create object URL for iframe
      const url = window.URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err) {
      console.error('Error loading PDF:', err)
      // Don't alert here to avoid spamming if just switching
      setPdfUrl(null)
    } finally {
      setLoadingPdf(false)
    }
  }

  // Cleanup PDF URL when component unmounts or report changes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const handleAddComment = async () => {
    if (!newComment.section || !newComment.comment.trim()) {
      alert('Please select a section and enter a comment')
      return
    }

    try {
      setSubmitting(true)
      const reportId = selectedReport.report_id || selectedReport.id
      await reportService.addQAComment(reportId, {
        report_id: reportId,
        section: newComment.section,
        comment: newComment.comment,
      })
      setNewComment({ section: '', comment: '' })
      await fetchQAComments(reportId)
      alert('Comment added successfully')
    } catch (err) {
      console.error('Error adding comment:', err)
      alert(`Failed to add comment: ${err.response?.data?.detail || err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReview = async (action) => {
    if (!confirm(`Are you sure you want to ${action} this report?`)) {
      return
    }

    try {
      setSubmitting(true)
      const reportId = selectedReport.report_id || selectedReport.id
      await reportService.reviewReport(reportId, action, '')
      alert(`Report ${action}d successfully`)
      await fetchSubmittedReports()
      setSelectedReport(null)
      setQAComments([])
    } catch (err) {
      console.error('Error reviewing report:', err)
      alert(`Failed to ${action} report: ${err.response?.data?.detail || err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadPDF = async (report) => {
    try {
      const token = localStorage.getItem('token')
      const reportId = report.report_id || report.id
      const blob = await reportService.exportPDF(reportId, token)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Report_${reportId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      alert(`Failed to download PDF: ${err.message || 'Unknown error'}`)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'SUBMITTED': 'bg-yellow-100 text-yellow-800',
      'QA_REVIEW': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
    }
    return statusMap[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">Loading submitted reports...</div>
    )
  }

  return (
    <>
      <style>{`
        .pdf-viewer-container {
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }
        .pdf-viewer-container iframe {
          overflow-x: hidden !important;
          overflow-y: auto !important;
        }
      `}</style>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Inspection Reports</h1>
          <p className="text-gray-600">Review submitted reports and provide QA feedback</p>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Reports List */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Reports</h2>
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8 text-sm">No submitted reports available</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div
                      key={report.report_id || report.id}
                      onClick={() => handleSelectReport(report)}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${selectedReport?.report_id === report.report_id || selectedReport?.id === report.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{report.title || 'Untitled Report'}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(report.status)}`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadPDF(report)
                        }}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Icons.Download />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Split Screen */}
          {selectedReport ? (
            <div className="flex-1 flex overflow-hidden">
              {/* Left: PDF Viewer (65%) */}
              <div className="flex-[0.65] bg-gray-100 flex flex-col">
                <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{selectedReport.title || 'Untitled Report'}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <div className="flex-1 pdf-viewer-container overflow-hidden">
                  {loadingPdf ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading PDF...</p>
                      </div>
                    </div>
                  ) : pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full border-0 pdf-viewer-container"
                      title="Report PDF Viewer"
                      type="application/pdf"
                      scrolling="no"
                      style={{
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        width: '100%',
                        height: '100%',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                      <p className="text-gray-500">PDF not available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: QA Review Panel (35%) */}
              <div className="flex-[0.35] bg-white border-l border-gray-200 overflow-y-auto">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">QA Review</h2>

                  {/* Existing Comments */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">QA Comments</h3>
                    {qaComments.length === 0 ? (
                      <p className="text-gray-500 text-sm">No comments yet</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {qaComments.map((comment) => (
                          <div key={comment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-medium text-red-600">{comment.section}</span>
                              <span className="text-xs text-gray-500">
                                {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Add Comment</h3>
                    <div className="space-y-3">
                      <select
                        value={newComment.section}
                        onChange={(e) => setNewComment({ ...newComment, section: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      >
                        <option value="">Select Section</option>
                        <option value="Header">Header</option>
                        <option value="Findings">Findings</option>
                        <option value="Photos">Photos</option>
                        <option value="Recommendations">Recommendations</option>
                        <option value="Conclusion">Conclusion</option>
                      </select>
                      <textarea
                        value={newComment.comment}
                        onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                        placeholder="Enter your comment..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={submitting || !newComment.section || !newComment.comment.trim()}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                      >
                        Add Comment
                      </button>
                    </div>
                  </div>

                  {/* Review Actions */}
                  {selectedReport.status !== 'APPROVED' && selectedReport.status !== 'REJECTED' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReview('approve')}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm"
                      >
                        <Icons.CheckCircle />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview('reject')}
                        disabled={submitting}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2 text-sm"
                      >
                        <Icons.XCircle />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">No report selected</p>
                <p className="text-gray-400 text-sm">Select a report from the list to start reviewing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default ReviewInspection
