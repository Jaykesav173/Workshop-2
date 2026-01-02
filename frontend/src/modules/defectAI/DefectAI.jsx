import React, { useState } from 'react';
import { Upload, X, Zap } from 'lucide-react';
import Loader from './components/Loader'; // Updated path
import PhotoCard from './components/PhotoCard'; // Updated path

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

      if (!response.ok) throw new Error("Batch analysis failed");

      const data = await response.json();
      const formattedResults = data.results.map((res) => {
        const originalFile = selectedFiles.find(f => f.name === res.filename);
        return {
          file: originalFile,
          findings: res.ai_findings,
          status: 'draft'
        };
      });

      setInspectionResults(formattedResults);
    } catch (err) {
      console.error("Analysis Error:", err);
      alert("Failed to analyze photos.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Confirm and Save
  const handleSave = async (index, editedFindings) => {
    const item = inspectionResults[index];
    const formData = new FormData();
    formData.append('file', item.file);
    formData.append('ai_description', editedFindings.description);
    formData.append('ai_recommendation', editedFindings.recommendation);
    formData.append('category', editedFindings.category);
    formData.append('severity', editedFindings.severity);

    const boxData = editedFindings.box_2d ? JSON.stringify(editedFindings.box_2d) : "[]";
    formData.append('box_2d', boxData);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch('http://localhost:8000/ai_photo/confirm', {
        method: 'POST',
        headers: headers, // Pass Auth Header (FormData handles Content-Type automatically)
        body: formData,
      });
      if (response.ok) {
        const newResults = [...inspectionResults];
        newResults[index].status = 'saved';
        setInspectionResults(newResults);
        fetchSavedDefects(); // Refresh saved list
      }
    } catch (err) {
      alert("Error saving finding");
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
              {savedDefects.map((defect) => (
                <div key={defect.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col">
                  <div className="h-48 overflow-hidden relative group">
                    <img src={defect.storage_url} alt={defect.file_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DefectAI; // Updated export