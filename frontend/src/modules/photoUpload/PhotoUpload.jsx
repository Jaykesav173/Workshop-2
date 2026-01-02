import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Plus, X, Edit2, Trash2, CheckCircle, Clock, Play,
  FileText, MapPin, Search, Filter, Eye, Upload
} from 'lucide-react';

const PhotoUpload = () => {
  // --- STATE ---
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [inspectorsList, setInspectorsList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [searchParams] = useSearchParams(); // Add search params hook

  const user = JSON.parse(localStorage.getItem('user')) || { role: 'ENGINEER', id: 0 };

  const [formData, setFormData] = useState({
    equipment_id: '',
    inspector_id: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    location: '',
    priority: 'Medium',
    details: ''
  });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [sch, ins, eq] = await Promise.all([
          axios.get('http://localhost:8000/schedules/all'),
          axios.get('http://localhost:8000/schedules/available-inspectors'),
          axios.get('http://localhost:8000/api/equipment/')
        ]);
        setInspectorsList(ins.data);
        setEquipmentList(eq.data || []);

        // --- FILTERING BY ROLE ---
        let allSchedules = sch.data;
        if (user.role === 'INSPECTOR') {
          allSchedules = allSchedules.filter(s => s.inspector_id === user.id);
        } else if (user.role === 'ENGINEER') {
          // "View a summary of all schedules they have created"
          allSchedules = allSchedules.filter(s => s.engineer_id === user.id);
        }
        // ADMIN sees all

        setSchedules(allSchedules);
      } catch (err) { console.error(err); }
    };
    fetchAll();
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = schedules;

    // Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Priority Filter
    if (priorityFilter !== 'All') {
      // Handle "High Priority" vs "High" mismatch by checking if the priority string includes the filter keyword
      // or just direct match if data is clean. Assuming data might be "High" but filter is "High".
      // The UI sets value to "High", "Medium", "Low". 
      result = result.filter(s => s.priority === priorityFilter);
    }

    setFilteredSchedules(result);
  }, [schedules, statusFilter, priorityFilter]);

  // --- DEEP LINKING LOGIC ---
  useEffect(() => {
    const scheduleId = searchParams.get('scheduleId');
    if (scheduleId && schedules.length > 0) {
      const found = schedules.find(s => s.schedule_id == scheduleId);
      if (found) {
        setSelectedTask(found);
        setIsDetailOpen(true);
      }
    }
  }, [searchParams, schedules]);

  // --- TIME VALIDATION LOGIC ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if End Time is before Start Time
    if (formData.start_time && formData.end_time) {
      if (formData.end_time <= formData.start_time) {
        alert("⚠️ Validation Error: End Time must be later than Start Time.");
        return; // Stop the submission
      }
    }

    try {
      // Find inspector email
      const inspector = inspectorsList.find(i => i.id == formData.inspector_id);
      const inspector_email = inspector ? inspector.email : null;

      await axios.post('http://localhost:8000/schedules/', {
        ...formData,
        engineer_id: user.id,
        inspector_email: inspector_email
      });
      setIsModalOpen(false);
      alert("✅ Schedule confirmed successfully!");
      // Refresh the list after success
      const sch = await axios.get('http://localhost:8000/schedules/all');
      setSchedules(sch.data);
      // setFilteredSchedules handled by useEffect
    } catch (err) {
      alert(err.response?.data?.detail || "Error saving schedule");
    }
  };

  // --- RESCHEDULE & CANCEL LOGIC ---
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ scheduled_date: '', start_time: '', end_time: '' });

  const handleCancelEvent = async () => {
    if (!selectedTask) return;
    if (!window.confirm("Are you sure you want to CANCEL this event?")) return;

    try {
      await axios.put(`http://localhost:8000/schedules/${selectedTask.schedule_id}`, { status: 'Cancelled' });
      alert("Event cancelled.");
      setIsDetailOpen(false);
      // Refresh
      const sch = await axios.get('http://localhost:8000/schedules/all');
      setSchedules(sch.data);
    } catch (err) {
      alert("Failed to cancel event: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await axios.put(`http://localhost:8000/schedules/${selectedTask.schedule_id}`, {
        scheduled_date: rescheduleData.scheduled_date,
        start_time: rescheduleData.start_time,
        end_time: rescheduleData.end_time,
        status: 'Pending'
      });
      alert("Event rescheduled successfully.");
      setIsRescheduleOpen(false);
      setIsDetailOpen(false);
      // Refresh
      const sch = await axios.get('http://localhost:8000/schedules/all');
      setSchedules(sch.data);
    } catch (err) {
      alert("Failed to reschedule: " + (err.response?.data?.detail || err.message));
    }
  };

  const openRescheduleModal = () => {
    setRescheduleData({
      scheduled_date: selectedTask.scheduled_date,
      start_time: selectedTask.start_time,
      end_time: selectedTask.end_time
    });
    setIsRescheduleOpen(true);
  };

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Inspection Control Center</h1>
          <p className="text-sm text-gray-500 italic">Role: <span className="text-blue-600 font-bold">{user.role}</span></p>
        </div>
        {(user.role === 'ENGINEER' || user.role === 'ADMIN') && (
          <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-all">
            <Plus size={18} /> New Schedule
          </button>
        )}
      </div>

      {/* Filters Row (No Search Bar) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-end gap-4 items-center">
        <select className="bg-gray-50 border px-4 py-2 rounded-xl text-sm outline-none cursor-pointer" onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select className="bg-gray-50 border px-4 py-2 rounded-xl text-sm outline-none cursor-pointer" onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Inspection</th>
              <th className="px-6 py-4">Timing</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredSchedules.map(s => (
              <tr key={s.schedule_id} className="hover:bg-blue-50/20 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-bold text-gray-800 block text-sm">EQ-{s.equipment_id}</span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 italic"><MapPin size={12} /> {s.location}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                  {s.scheduled_date} <br />
                  <span className="text-gray-400 font-normal italic">{s.start_time} - {s.end_time}</span>
                </td>
                <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setSelectedTask(s); setIsDetailOpen(true); }} className="text-sm font-bold text-gray-700 hover:text-blue-600 flex items-center gap-2 ml-auto transition-colors">
                    <Eye size={16} /> View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: NEW ASSIGNMENT (WITH LABELED TIMING BOXES) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-black italic">New Inspection</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Equipment & Location Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Equipment *</label>
                  <select
                    required
                    className="bg-white border border-gray-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({ ...formData, equipment_id: val });
                      // Optional: Auto-fill location if found
                      const eq = equipmentList.find(x => x.id.toString() === val);
                      if (eq && eq.location) setFormData(prev => ({ ...prev, location: eq.location }));
                    }}
                  >
                    <option value="">Select Equipment</option>
                    {equipmentList.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.equipment_tag_no ? `${eq.equipment_tag_no}` : (eq.name || `ID: ${eq.id}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Building A"
                    required
                    value={formData.location} // Bind value to state for auto-fill
                    className="bg-white border border-gray-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
              </div>

              {/* Titled Timing Row */}
              <div className="grid grid-cols-3 gap-3 bg-gray-50/50 p-3 rounded-2xl border border-dashed">
                <InputGroup label="Date *" type="date" onChange={v => setFormData({ ...formData, scheduled_date: v })} />
                <InputGroup label="Start Time *" type="time" onChange={v => setFormData({ ...formData, start_time: v })} />
                <InputGroup label="End Time *" type="time" onChange={v => setFormData({ ...formData, end_time: v })} />
              </div>

              {/* Assignment Selects */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Assign Inspector *</label>
                  <select required className="bg-white border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setFormData({ ...formData, inspector_id: e.target.value })}>
                    <option value="">Select Inspector</option>
                    {inspectorsList.map(ins => <option key={ins.id} value={ins.id}>{ins.username}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Priority Level *</label>
                  <select className="bg-white border p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500" onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-black text-white py-4 rounded-2xl font-bold italic shadow-xl hover:bg-gray-800 active:scale-95 transition-all">
                Confirm Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILS (FROM YOUR UI) */}
      {isDetailOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold italic underline decoration-blue-500">Inspection Information</h2>
                <p className="text-[10px] text-gray-400 tracking-widest mt-1">REF: SCH-00{selectedTask.schedule_id}</p>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="hover:bg-white/20 p-2 rounded-full"><X size={24} /></button>
            </div>
            <div className="p-8 grid grid-cols-2 gap-10">
              <div className="space-y-6">
                {(() => {
                  const eq = equipmentList.find(e => e.id === selectedTask.equipment_id) || {};
                  const ins = inspectorsList.find(i => i.id === selectedTask.inspector_id) || {};
                  return (
                    <>
                      <DetailRow label="Equipment" value={eq.equipment_tag_no || eq.name || `#${selectedTask.equipment_id}`} />
                      <DetailRow label="Location" value={eq.location || selectedTask.location || "N/A"} icon={<MapPin size={14} />} />

                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inspector Assigned</span>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            {(ins.username || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-700">{ins.username || "Unknown Inspector"}</div>
                            <div className="text-[10px] text-gray-400">ID: {selectedTask.inspector_id}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="space-y-6 border-l pl-10 border-gray-100">
                <DetailRow label="Scheduled Timing" value={`${selectedTask.scheduled_date} (${selectedTask.start_time}-${selectedTask.end_time})`} />
                <DetailRow label="Priority" value={selectedTask.priority} />
                {/* Status Display Only */}
                <DetailRow label="Status" value={selectedTask.status} isStatus />
              </div>
            </div>
            <div className="bg-gray-50 p-6 flex justify-between">

              {/* INSPECTOR ACTIONS */}
              {user.role === 'INSPECTOR' && (
                <div className="flex gap-2">
                  {selectedTask.status === 'Pending' && (
                    <button
                      onClick={async () => {
                        try {
                          await axios.put(`http://localhost:8000/schedules/${selectedTask.schedule_id}`, { status: 'Confirmed' });
                          setSelectedTask({ ...selectedTask, status: 'Confirmed' });
                          const sch = await axios.get('http://localhost:8000/schedules/all');
                          setSchedules(sch.data);
                          alert("Assignment Confirmed!");
                        } catch (e) { alert("Error updating status"); }
                      }}
                      className="px-6 py-3 bg-green-500 text-white rounded-2xl font-bold hover:bg-green-600 transition-colors shadow-lg flex items-center gap-2"
                    >
                      <CheckCircle size={18} /> Confirm Inspection
                    </button>
                  )}
                  {selectedTask.status === 'Confirmed' && (
                    <button
                      onClick={async () => {
                        try {
                          await axios.put(`http://localhost:8000/schedules/${selectedTask.schedule_id}`, { status: 'In Progress' });
                          setSelectedTask({ ...selectedTask, status: 'In Progress' });
                          const sch = await axios.get('http://localhost:8000/schedules/all');
                          setSchedules(sch.data);
                          alert("Inspection Started!");
                        } catch (e) { alert("Error updating status"); }
                      }}
                      className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-colors shadow-lg flex items-center gap-2"
                    >
                      <Play size={18} /> Start Inspection
                    </button>
                  )}
                  {selectedTask.status === 'In Progress' && (
                    <button
                      onClick={async () => {
                        try {
                          await axios.put(`http://localhost:8000/schedules/${selectedTask.schedule_id}`, { status: 'Completed' });
                          setSelectedTask({ ...selectedTask, status: 'Completed' });
                          const sch = await axios.get('http://localhost:8000/schedules/all');
                          setSchedules(sch.data);
                          alert("Inspection Completed!");
                        } catch (e) { alert("Error updating status"); }
                      }}
                      className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-lg flex items-center gap-2"
                    >
                      <CheckCircle size={18} /> Mark Completed
                    </button>
                  )}
                </div>
              )}

              {/* ADMIN / ENGINEER ACTIONS */}
              {(user.role === 'ADMIN' || user.role === 'ENGINEER') && (
                <div className="flex gap-2">
                  <button onClick={handleCancelEvent} className="px-6 py-3 border border-red-200 text-red-600 bg-red-50 rounded-2xl font-bold hover:bg-red-100 transition-colors">
                    Cancel Event
                  </button>
                  <button onClick={openRescheduleModal} className="px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-2xl font-bold hover:bg-gray-50 transition-colors">
                    Reschedule
                  </button>
                </div>
              )}

              <button onClick={() => setIsDetailOpen(false)} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: RESCHEDULE */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-xl font-black italic">Reschedule Event</h2>
              <button onClick={() => setIsRescheduleOpen(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <InputGroup label="New Date *" type="date" placeholder="" onChange={v => setRescheduleData({ ...rescheduleData, scheduled_date: v })} />
              <div className="grid grid-cols-2 gap-3">
                <InputGroup label="Start Time *" type="time" placeholder="" onChange={v => setRescheduleData({ ...rescheduleData, start_time: v })} />
                <InputGroup label="End Time *" type="time" placeholder="" onChange={v => setRescheduleData({ ...rescheduleData, end_time: v })} />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors mt-2">
                Confirm Change
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- HELPER COMPONENTS ---

const InputGroup = ({ label, placeholder, type = "text", onChange }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 tracking-widest">{label}</label>
    <input
      required
      type={type}
      placeholder={placeholder}
      className="bg-white border border-gray-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const DetailRow = ({ label, value, icon, isStatus }) => (
  <div>
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-2 mt-1">
      {icon && <span className="text-blue-500">{icon}</span>}
      <span className={`text-sm font-bold ${isStatus ? 'text-blue-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = { Pending: 'bg-yellow-50 text-yellow-600 border-yellow-100', Confirmed: 'bg-blue-50 text-blue-600 border-blue-100', Completed: 'bg-green-50 text-green-600 border-green-100' };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${styles[status] || 'bg-gray-50 text-gray-600'}`}>{status}</span>;
};

export default PhotoUpload;