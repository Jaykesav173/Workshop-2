import React, { useState } from 'react';
import { Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
// 1. ADD THIS IMPORT
import DefectPointer from './DefectPointer'; 

const PhotoCard = ({ item, index, onSave, onDiscard }) => {
  const [localFindings, setLocalFindings] = useState({ ...item.findings });

  const handleChange = (field, value) => {
    setLocalFindings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-lg">
      
      {/* Image Preview Section */}
      <div className="w-full md:w-80 h-64 md:h-auto bg-slate-100 relative">
        <DefectPointer 
            imageUrl={URL.createObjectURL(item.file)} 
            box={localFindings.box_2d} 
        />
        
        {/* 2. FIXED: This overlay was outside the relative div in your snippet */}
        {item.status === 'saved' && (
          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[2px] z-10">
             <div className="bg-white p-2 rounded-full shadow-lg">
                <CheckCircle className="text-emerald-500 w-8 h-8" />
             </div>
          </div>
        )}
      </div> {/* <-- This was the extra closing div that needed fixing */}

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-2 items-center">

            {/* DEFECT TYPES */}
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-black uppercase italic">
              {localFindings.category || "General"}
            </span>

            {/* SEVERITY */}
            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
            localFindings.severity === 'High' || localFindings.severity === 'Critical' 
                ? 'bg-red-100 text-red-600' 
                : localFindings.severity === 'Medium'
                ? 'bg-amber-100 text-amber-600' // Yellow/Amber
                : 'bg-emerald-100 text-emerald-600' // Green for Low
            }`}>
              {localFindings.severity}
            </span>

          </div>
          <span className="text-[10px] text-slate-400 font-mono">FILE: {item.file.name}</span>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Technical Findings</label>
            <textarea 
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              rows="3"
              value={localFindings.description}
              onChange={(e) => handleChange('description', e.target.value)}
              disabled={item.status === 'saved'}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Action</label>
            <textarea 
              className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              rows="2"
              value={localFindings.recommendation}
              onChange={(e) => handleChange('recommendation', e.target.value)}
              disabled={item.status === 'saved'}
            />
          </div>
        </div>

        

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
          {item.status === 'saved' ? (
            <span className="text-emerald-600 font-bold text-sm flex items-center gap-2">
              <CheckCircle size={16} /> Data synced with Supabase
            </span>
          ) : (
            <>
              <button 
                onClick={() => onSave(index, localFindings)}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-semibold transition-transform active:scale-95"
              >
                <Save size={16} /> Confirm Save
              </button>
              <button 
                onClick={() => onDiscard(index)}
                className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                title="Discard photo"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoCard;