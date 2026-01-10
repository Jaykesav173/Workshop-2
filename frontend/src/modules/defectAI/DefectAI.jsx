import React, { useState } from 'react';
import { Upload, X, Zap } from 'lucide-react';
import Loader from './components/Loader'; // Updated path
import PhotoCard from './components/PhotoCard'; // Updated path
import { isValidImageUrl, getSafeImageUrl, needsReupload } from '../../utils/imageUtils';

const DefectAI = () => { // Changed name to match folder/file name
  const [savedDefects, setSavedDefects] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [inspectionResults, setInspectionResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch saved defects on mount
  React.useEffect(() => {
    fetchSavedDefects();
  }, []);

  const fetchSavedDefects = async () => {
    setLoadingSaved(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/ai_photo/my_defects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure data is array to prevent map() crash
        if (Array.isArray(data)) {
          setSavedDefects(data);
        } else {
          console.error("API Error: saved defects is not an array", data);
          setSavedDefects([]);
        }
      }
    } catch (err) {
      console.error("Error fetching saved defects", err);
    } finally {
      setLoadingSaved(false);
    }
  };

  // 1. Handle File Selection
  const onFileChange = (e) => {
    if (e.target.files) {
      const incomingFiles = Array.from(e.target.files);
      setSelectedFiles(prevFiles => {
        const uniqueNewFiles = incomingFiles.filter(
          newFile => !prevFiles.some(oldFile => oldFile.name === newFile.name)
        );
        return [...prevFiles, ...uniqueNewFiles];
      });
    }
  };

  const removeFileFromPreview = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const discardPhoto = (index) => {
    const newResults = inspectionResults.filter((_, i) => i !== index);
    setInspectionResults(newResults);
    if (newResults.length === 0) setSelectedFiles([]);
  };

  // 2. Trigger AI Analysis
  const runAnalysis = async () => {
    if (selectedFiles.length === 0) return;
    setIsAnalyzing(true);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/ai_photo/analyze', {
        method: 'POST',
        body: formData,
      });

      // Check if response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Batch analysis failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error("Analysis Error Response:", response.status, errorMessage);
        alert(`Failed to analyze photos: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check if we got results
      if (!data.results || !Array.isArray(data.results)) {
        console.error("Invalid response format:", data);
        alert("Invalid response from server. Please check backend logs.");
        throw new Error("Invalid response format");
      }

      const formattedResults = data.results.map((res) => {
        const originalFile = selectedFiles.find(f => f.name === res.filename);
        
        // Extract findings - res.ai_findings is the structure from backend
        const rawFindings = res.ai_findings || res.findings || {};
        const findings = {
          description: rawFindings.description || res.error || "Analysis failed",
          recommendation: rawFindings.recommendation || "Please review manually.",
          category: rawFindings.category || "UNKNOWN",
          severity: rawFindings.severity || "MEDIUM",
          box_2d: rawFindings.box_2d || []
        };
        
        // Debug logging
        console.log(`Processing result for ${res.filename}:`, {
          rawResponse: res,
          hasAiFindings: !!res.ai_findings,
          aiFindings: res.ai_findings,
          processedFindings: findings
        });
        
        if (!originalFile) {
          console.warn(`Original file not found for ${res.filename} in selectedFiles`);
        }
        
        return {
          file: originalFile,
          findings: findings,
          status: res.error ? 'error' : 'draft'
        };
      });

      console.log("All formatted results:", formattedResults);
      setInspectionResults(formattedResults);
    } catch (err) {
      console.error("Analysis Error:", err);
      // Only show alert if it's not already shown
      if (!err.message || !err.message.includes("Failed to analyze photos")) {
        alert(`Failed to analyze photos: ${err.message || err}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Confirm and Save
  const handleSave = async (index, editedFindings) => {
    const item = inspectionResults[index];
    
    // Validate before saving
    const desc = (editedFindings.description || '').trim();
    const rec = (editedFindings.recommendation || '').trim();
    const cat = editedFindings.category || '';
    const sev = editedFindings.severity || '';
    
    if (desc.length < 3 || rec.length < 3 || !cat || !sev) {
      alert("Please ensure description and recommendation have at least 3 characters, and category and severity are selected.");
      return;
    }
    
    const formData = new FormData();
    formData.append('file', item.file);
    formData.append('ai_description', desc);
    formData.append('ai_recommendation', rec);
    formData.append('category', cat);
    formData.append('severity', sev);

    const boxData = editedFindings.box_2d ? JSON.stringify(editedFindings.box_2d) : "[]";
    formData.append('box_2d', boxData);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Please log in to save defects.");
        return;
      }
      
      const headers = { 'Authorization': `Bearer ${token}` };

      const response = await fetch('http://localhost:8000/ai_photo/confirm', {
        method: 'POST',
        headers: headers,
        body: formData,
      });
      
      if (response.ok) {
        const newResults = [...inspectionResults];
        newResults[index].status = 'saved';
        setInspectionResults(newResults);
        fetchSavedDefects(); // Refresh saved list
        // Show success message (optional - you can remove this if you prefer)
        console.log("Defect saved successfully!");
      } else {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        alert(`Failed to save defect: ${errorData.detail || response.statusText}`);
      }
    } catch (err) {
      console.error("Error saving defect:", err);
      alert(`Error saving defect: ${err.message || "Network error"}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">AI Defect Detection</h1>
          <p className="text-slate-500 font-medium">Upload inspection images to automatically analyse surface defects</p>
        </header>

        {!isAnalyzing && inspectionResults.length === 0 && (
          <div className="space-y-6">
            <div className={`border-2 border-dashed rounded-2xl text-center transition-all ${selectedFiles.length > 0 ? 'p-6 bg-white border-slate-200' : 'p-12 bg-blue-50/50 border-blue-300'
              }`}>
              <input type="file" multiple onChange={onFileChange} className="hidden" id="vessel-upload" />
              <label htmlFor="vessel-upload" className="cursor-pointer group">
                <Upload className={`mx-auto text-blue-400 mb-2 group-hover:scale-110 transition-transform ${selectedFiles.length > 0 ? 'w-8 h-8' : 'w-16 h-16'
                  }`} />
                <p className="text-lg font-bold text-blue-900">
                  {selectedFiles.length > 0 ? 'Add More Photos' : 'Upload Inspection Photos'}
                </p>
                <p className="text-blue-500 mt-1">{selectedFiles.length} photos uploaded</p>
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Reviewing {selectedFiles.length} Photos
                    </span>
                    <button onClick={() => setSelectedFiles([])} className="text-xs text-red-500 font-bold hover:underline">
                      REMOVE ALL
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                        <img
                          src={URL.createObjectURL(file)}
                          className="w-full h-full object-cover"
                          alt="preview"
                        />
                        <button
                          onClick={() => removeFileFromPreview(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedFiles.length > 0 && (
              <button
                onClick={runAnalysis}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
              >
                <Zap size={20} fill="currentColor" />
                Run AI Diagnostics
              </button>
            )}
          </div>
        )}

        {isAnalyzing && (
          <div className="flex justify-center py-20">
            <Loader message="AI is processing all uploaded photos..." />
          </div>
        )}

        {!isAnalyzing && inspectionResults.length > 0 && (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-600 font-bold uppercase text-xs tracking-widest">
                Found {inspectionResults.length} potential issues
              </p>
              <button
                onClick={() => { setInspectionResults([]); setSelectedFiles([]); }}
                className="text-red-500 text-xs font-black uppercase hover:underline"
              >
                Clear All Results
              </button>
            </div>

            {inspectionResults.map((item, idx) => (
              <PhotoCard
                key={idx}
                item={item}
                index={idx}
                onSave={handleSave}
                onDiscard={discardPhoto}
              />
            ))}
          </div>
        )}

        {/* --- SECTION: MY SAVED DEFECTS --- */}
        <div className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Zap size={20} /></span>
            My Saved Defects
          </h2>

          {loadingSaved ? (
            <p className="text-slate-500 italic">Loading your saved defects...</p>
          ) : savedDefects.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center">
              <p className="text-slate-400 font-medium">No defects saved yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedDefects.map((defect) => {
                const imageUrl = getSafeImageUrl(defect.storage_url);
                const invalidUrl = needsReupload(defect.storage_url);
                
                return (
                  <div key={defect.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col">
                    <div className="h-48 overflow-hidden relative group bg-slate-100">
                      {invalidUrl ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-red-50 border-2 border-red-200 border-dashed">
                          <p className="text-red-600 text-sm font-bold mb-2">⚠️ Invalid Image</p>
                          <p className="text-red-500 text-xs text-center">This image was stored with a local path and needs to be re-uploaded.</p>
                        </div>
                      ) : (
                        <img 
                          src={imageUrl} 
                          alt={defect.file_name || 'Defect image'} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            console.error('Failed to load image:', defect.storage_url);
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-slate-200 text-slate-500 text-sm">Image failed to load</div>';
                          }}
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-md">
                        {defect.category || 'Unknown'}
                      </div>
                    </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 line-clamp-1" title={defect.file_name}>{defect.file_name}</h3>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${defect.severity === 'High' ? 'bg-red-100 text-red-600' :
                        defect.severity === 'Medium' ? 'bg-orange-100 text-orange-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                        {defect.severity || 'Low'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4 line-clamp-2">{defect.ai_description}</p>

                    <div className="mt-auto pt-4 border-t border-slate-50">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Recommendation</p>
                      <p className="text-xs text-slate-700 italic">{defect.ai_recommendation}</p>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DefectAI; // Updated export
