
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronDown, Upload, Search, ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react";

import {
  createEquipment,
  uploadEquipmentImage,
  getAllEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentById,
  getEquipmentOptions,
  getPartViewOptions,
  getMaterialOptions
} from "./equipmentApi.jsx";

// Form Row Component
const FormRow = React.memo(({ label, placeholder, type = "input", name, form, setForm, onChange, error, options = [], valueKey = "id", labelKey = "description", required, className }) => {
  if (type === "select" && label === "Material:") {
    console.log(`[FormRow] Material Options:`, options);
  }
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-bold text-gray-800">
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </label>

      {type === "input" ? (
        <input
          type="text"
          name={name}
          placeholder={placeholder}
          value={form[name] || ""}
          onChange={onChange || ((e) => setForm({ ...form, [name]: e.target.value }))}
          className={`w-full px-3 text-base text-gray-800 focus:outline-none placeholder-gray-500 bg-white h-10 rounded-lg border shadow-sm focus:ring-1 
          ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"}`}
        />
      ) : (
        <div className="relative w-full">
          <select
            name={name}
            value={form[name] || ""}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            className="w-full px-3 text-base text-gray-800 focus:outline-none bg-white h-10 rounded-lg appearance-none cursor-pointer border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option disabled value="">
              {placeholder}
            </option>
            {Array.isArray(options) && options.map((opt) => (
              <option key={opt.id} value={opt[valueKey]}>{opt[labelKey]}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown size={18} className="text-gray-500" />
          </div>
        </div>
      )}
      {error && <span className="text-red-500 text-xs font-semibold">{error}</span>}
    </div>
  );
});

const DetailsRow = ({ label, value }) => (
  <div className="flex items-center mb-1 w-full justify-center">
    <span className="w-1/3 text-right text-base font-bold text-black mr-6 select-none">
      {label}
    </span>
    <div className="w-1/2 min-h-[44px] bg-[#e9e9e9] rounded-lg flex items-center px-4 text-base text-[#333] shadow-sm">
      {value || "Value"}
    </div>
  </div>
);

// const InstructionField = () => (
//   <div className="mt-8 px-4">
//     <div className="text-sm font-normal text-black mb-4">
//       Please insert the equipment number of the equipment that requires changes.
//     </div>
//     <div className="flex items-center gap-4">
//       <span className="text-sm font-bold text-black min-w-[152px]">
//         Equipment Tag No:
//       </span>
//       <input
//         type="text"
//         placeholder="Value"
//         className="w-[305px] h-9 bg-gray-300 rounded-xl px-4 text-sm text-gray-700 placeholder-gray-500 shadow-inner"
//       />
//     </div>
//   </div>
// );

export default function EquipmentDetailsRegistration() {

  // States
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Equipment Registration");
  const [options, setOptions] = useState({ types: [], materials: [] });
  const [partViewOptions, setPartViewOptions] = useState([]); // Dynamic part views from DB

  const [form, setForm] = useState({
    equipment_tag_no: "",
    equipment_description: "",
    plant_area: "",
    dosh_registration_no: "",
    type_id: "",
    material_id: "",
    nominal_thickness: "",
    corrosion_allowance: "",
    design_pressure: "",
    design_temperature: "",
    location: "",
    status: "ACTIVE"
  });

  const [errors, setErrors] = useState({});

  const [imageFile, setImageFile] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [equipmentList, setEquipmentList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [viewParts, setViewParts] = useState([]); // Array of { id, file, viewType, previewUrl, existingUrl }

  // Filter State
  const [filterCategory, setFilterCategory] = useState("");
  const [filterValue, setFilterValue] = useState("");

  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const token = localStorage.getItem("token");

  // loads equipment list 
  useEffect(() => {
    if (activeTab === "Equipment Details") {
      loadAllEquipment();
    }
  }, [activeTab]);

  // Load part views on mount
  useEffect(() => {
    async function loadPartViews() {
      try {
        const res = await getPartViewOptions(token);
        if (res.data && res.data.part_views) {
          setPartViewOptions(res.data.part_views);
        } else {
          setPartViewOptions(["East Side", "South Side", "West Side", "North Side", "Nameplate", "Top View"]);
        }
      } catch (err) {
        console.error("Failed to load part views", err);
        // Fallback defaults
        setPartViewOptions(["East Side", "South Side", "West Side", "North Side", "Nameplate", "Top View"]);
      }
    }
    loadPartViews();
  }, [activeTab]);

  async function loadAllEquipment() {
    try {
      console.log("Fetching equipment list...");
      const res = await getAllEquipment(token);
      console.log("Equipment list response:", res.data);
      setEquipmentList(res.data);
    } catch (err) {
      console.error("Failed to load equipment list", err);
      alert("Failed to load equipment list. Check console.");
    }
  }

  // Handle number validation
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Allow empty string or check if it's a number
    if (value && isNaN(Number(value))) {
      setErrors((prev) => ({ ...prev, [name]: "Please insert numbers only" }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // View Parts Handlers
  const handleAddPart = () => {
    setViewParts([...viewParts, { id: Date.now(), file: null, partView: "", previewUrl: null }]);
  };

  const handleRemovePart = (id) => {
    setViewParts(viewParts.filter(p => p.id !== id));
  };

  const handlePartChange = (id, field, value) => {
    setViewParts(viewParts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handlePartImageChange = (id, file) => {
    if (file) {
      setViewParts(viewParts.map(p => p.id === id ? { ...p, file, previewUrl: URL.createObjectURL(file) } : p));
    }
  };

  // to save the equipment information (display warning if press save button without filing the information)
  async function handleSaveEquipment() {
    try {
      if (!form.equipment_tag_no || !form.equipment_description || !form.location || !form.dosh_registration_no || !form.type_id) {
        alert("Please fill in all required fields.");
        return;
      }

      // Check for validation errors
      const hasErrors = Object.values(errors).some((err) => err !== null);
      if (hasErrors) {
        alert("Please fix the validation errors before saving.");
        return;
      }

      // Check for duplicates
      try {
        const res = await getAllEquipment(token);
        const existingList = res.data;

        // Check for duplicate Tag No or DOSH No
        // Exclude the current equipment if we are editing (editingId)
        const duplicate = existingList.find(item =>
          ((item.equipment_tag_no === form.equipment_tag_no) ||
            (item.dosh_registration_no === form.dosh_registration_no)) &&
          (!editingId || item.id !== editingId)
        );

        if (duplicate) {
          alert(`Equipment with this Tag No (${duplicate.equipment_tag_no}) or DOSH No (${duplicate.dosh_registration_no}) already exists.`);
          setViewingItem(duplicate);
          setActiveTab("Equipment Details");
          return;
        }
      } catch (err) {
        console.error("Failed to check for duplicates", err);
        //alert user if the checking fails

        alert("Network error: Unable to verify if equipment exists. Please try again.");
        return;
      }

      const payload = {
        ...form,
        type_id: parseInt(form.type_id),
        material_id: form.material_id ? parseInt(form.material_id) : null,
        nominal_thickness: parseFloat(form.nominal_thickness) || 0,
        corrosion_allowance: parseFloat(form.corrosion_allowance) || 0,
        design_pressure: parseFloat(form.design_pressure) || 0,
        design_temperature: parseFloat(form.design_temperature) || 0,
        location: form.location || form.plant_area
      };

      console.log("Saving Equipment Payload:", payload);
      console.log("Using Token:", token ? token.substring(0, 10) + "..." : "NO TOKEN");

      let equipmentId;
      if (editingId) {
        const res = await updateEquipment(editingId, payload, token);
        equipmentId = res.data.id;
        alert("Equipment updated successfully!");
      } else {
        const res = await createEquipment(payload, token);
        equipmentId = res.data.id;
        alert("Equipment saved successfully!");
      }

      if (imageFile) {
        await uploadEquipmentImage(equipmentId, imageFile, token, "General");
      }

      // Upload View Parts
      console.log("Starting view parts upload. Total parts:", viewParts.length);
      for (const part of viewParts) {
        console.log(`Processing part ${part.id}. File: ${!!part.file}, PartView: ${part.partView}`);
        if (part.file && part.partView) {
          console.log(`Uploading part ${part.id} with view: ${part.partView}`);
          await uploadEquipmentImage(equipmentId, part.file, token, part.partView);
        } else {
          console.warn(`Skipping part ${part.id} - Missing file or view type`);
        }
      }

      if (editingId) {
        try {
          // Fetch updated data to ensure image and details are current in the view
          const updatedItemRes = await getEquipmentById(equipmentId, token);
          setViewingItem(updatedItemRes.data);
          setActiveTab("Equipment Details");
        } catch (fetchErr) {
          console.error("Failed to fetch updated item for view", fetchErr);
        }
        loadAllEquipment();
      }

      // Reset form for new registration
      setForm({
        equipment_tag_no: "",
        equipment_description: "",
        plant_area: "",
        dosh_registration_no: "",
        type_id: "",
        material: "",
        nominal_thickness: "",
        corrosion_allowance: "",
        design_pressure: "",
        design_temperature: "",
        location: "",
        status: "ACTIVE"
      });
      setErrors({});
      setImageFile(null);
      setEditImageUrl(null);
      setEditingId(null);
      setViewParts([]);

    } catch (error) {
      console.error("Error saving equipment:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Failed to save equipment.";
      alert(errorMessage);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this equipment?")) return;
    try {
      await deleteEquipment(id, token);
      alert("Equipment deleted successfully!");
      loadAllEquipment();
      setViewingItem(null);
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete equipment");
    }
  }

  async function handleStatusUpdate(newStatus) {
    if (!viewingItem) return;
    try {
      const payload = {
        ...viewingItem,
        status: newStatus,
        type_id: parseInt(viewingItem.type_id),
        nominal_thickness: parseFloat(viewingItem.nominal_thickness) || 0,
        corrosion_allowance: parseFloat(viewingItem.corrosion_allowance) || 0,
        design_pressure: parseFloat(viewingItem.design_pressure) || 0,
        design_temperature: parseFloat(viewingItem.design_temperature) || 0,
      };

      // Remove generic fields that might cause issues if spread from viewingItem
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.image_url;

      await updateEquipment(viewingItem.id, payload, token);

      // Update local state without full reload for speed
      setViewingItem({ ...viewingItem, status: newStatus });
      loadAllEquipment();
      alert("Status updated successfully!");
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  }

  function handleEdit(item) {
    setForm({
      equipment_tag_no: item.equipment_tag_no,
      equipment_description: item.equipment_description,
      plant_area: item.location || "",
      location: item.location || "",
      dosh_registration_no: item.dosh_registration_no,
      type_id: item.type_id,
      material_id: item.material_id, // Use ID
      nominal_thickness: item.nominal_thickness,
      corrosion_allowance: item.corrosion_allowance,
      design_pressure: item.design_pressure,
      design_temperature: item.design_temperature,
      status: item.status || "ACTIVE"
    });
    setErrors({});
    setEditingId(item.id);
    setEditImageUrl(item.image_url); // Set existing image URL

    if (item.photos && item.photos.length > 0) {
      const parts = item.photos
        .filter(p => p.part_view !== "General") // Exclude main image if strictly "General"
        .map(p => ({
          id: p.id,
          file: null,
          partView: p.part_view || "",
          previewUrl: null,
          existingUrl: p.file_path ? `/static/uploads/${p.file_path.split(/[\\/]/).pop()}` : null // Construct URL
        }));
      setViewParts(parts);
    } else {
      setViewParts([]);
    }

    setActiveTab("Equipment Details Update");
  }


  // load dropdown list options
  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    console.log("[Equipment] loadOptions called");
    try {
      // Load types
      try {
        const resTypes = await getEquipmentOptions(token);
        console.log("[Equipment] Types loaded:", resTypes.data);
        setOptions(prev => ({ ...prev, types: resTypes.data.types || [] }));
      } catch (e) {
        console.error("[Equipment] Failed to load types", e);
      }

      // Load materials
      try {
        const resMaterials = await getMaterialOptions(token);
        console.log("[Equipment] Materials loaded:", resMaterials.data);
        setOptions(prev => ({ ...prev, materials: resMaterials.data.materials || [] }));
      } catch (e) {
        console.error("[Equipment] Failed to load materials", e);
        if (e.response) {
          console.error("[Equipment] Server Error Details:", e.response.data);
        }
      }

    } catch (err) {
      console.error("[Equipment] Unexpected error in loadOptions", err);
    }
  }

  // Helper Components
  const menuItems = [
    editingId ? "Equipment Details Update" : "Equipment Registration",
    "Equipment Details",
  ];

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

  // RENDER UI
  return (

    <div className="bg-white min-h-screen font-sans text-black w-full">

      {/* Page Title */}
      <div className="px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-800">Equipment Information</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-8 pt-0 space-x-0 border-b border-gray-300">
        {menuItems.map((item) => (
          <button
            key={item}
            onClick={() => {
              // Prevent switching to Update tab manually if not editing, or handle logic
              if (item === "Equipment Details Update" && !editingId) return;

              setActiveTab(item);

              if (item === "Equipment Registration" && !editingId) {
                // Clear form if switching to registration and not editing
                setForm({
                  equipment_tag_no: "",
                  equipment_description: "",
                  plant_area: "",
                  dosh_registration_no: "",
                  type_id: "",
                  material: "",
                  nominal_thickness: "",
                  corrosion_allowance: "",
                  design_pressure: "",
                  design_temperature: "",
                  location: "",
                  status: "ACTIVE"
                });
                setErrors({});
                setViewParts([]);
              }
            }}
            className={`
              text-sm px-6 py-2 font-bold transition-all duration-300
              ${activeTab === item
                ? "bg-blue-500 text-white shadow-md transform scale-[1.02]"
                : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 border border-transparent"
              }
            `}
            style={{
              borderRadius: "8px 8px 0 0",
              marginRight: "4px",
            }}
          >
            {item}
          </button>
        ))}
        <div className="flex-1 border-b border-gray-300"></div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="w-full">

          {/* Equipment Registration / Update page */}
          {(activeTab === "Equipment Registration" || activeTab === "Equipment Details Update") && (
            <div className="p-5 bg-[#f8f8f8] rounded-2xl shadow-lg">
              <div className="flex flex-col md:flex-row gap-6">

                {/* Left side - Image */}
                <div className="w-full md:w-1/3 flex flex-col items-center pt-8">
                  <div
                    className={`w-full overflow-hidden border-2 border-dashed rounded-lg min-h-[520px] flex flex-col items-center justify-center transition-colors
                      ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-200"}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        setImageFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    {imageFile ? (
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Equipment Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : editImageUrl ? (
                      <img
                        src={`http://localhost:8000${editImageUrl}`}
                        alt="Current Equipment"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col text-center items-center text-gray-500">
                        <Upload size={48} className="opacity-30 mb-2" />
                        <span className="text-base font-medium text-gray-600">Drag and drop an image here (General View only)</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="hidden"
                    id="equipment-image"
                  />

                  <button
                    className="mt-6 px-6 py-2 text-base font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md transition-colors"
                    onClick={() => document.getElementById("equipment-image").click()}
                  >
                    {imageFile ? "Change Image" : (editImageUrl ? "Insert new image" : "Insert Image from Files")}
                  </button>
                </div>

                {/* Right side - Form */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                  <FormRow label="Equipment Tag No:" placeholder="eg. T-101" name="equipment_tag_no" form={form} setForm={setForm} options={options} required />
                  <FormRow label="Plant/Unit/Area:" placeholder="eg. Plant A" name="location" form={form} setForm={setForm} options={options} required />

                  <FormRow label="Equipment Description:" placeholder="eg. Nitrogen Vessel" name="equipment_description" form={form} setForm={setForm} options={options} required className="md:col-span-2" />

                  <FormRow label="DOSH Registration No:" placeholder="eg. MK PMT 1001" name="dosh_registration_no" form={form} setForm={setForm} options={options} required />
                  <FormRow label="Type:" placeholder="Select Type" type="select" name="type_id" form={form} setForm={setForm} options={options.types} valueKey="id" required />

                  <div className="md:col-span-2 h-px bg-gray-200 my-2"></div>

                  <FormRow label="Material:" placeholder="Select Material" type="select" name="material_id" form={form} setForm={setForm} options={options.materials} valueKey="id" />

                  {/* Numeric Fields with Validation */}
                  <FormRow
                    label="Nominal Thickness (mm):"
                    placeholder="eg. 10"
                    name="nominal_thickness"
                    form={form}
                    setForm={setForm}
                    onChange={handleNumericChange}
                    error={errors.nominal_thickness}
                    options={options}
                  />

                  <FormRow
                    label="Corrosion Allowance (mm):"
                    placeholder="eg. 1"
                    name="corrosion_allowance"
                    form={form}
                    setForm={setForm}
                    onChange={handleNumericChange}
                    error={errors.corrosion_allowance}
                    options={options}
                  />
                  <FormRow
                    label="Design Pressure (barg):"
                    placeholder="eg. 10"
                    name="design_pressure"
                    form={form}
                    setForm={setForm}
                    onChange={handleNumericChange}
                    error={errors.design_pressure}
                    options={options}
                  />

                  <FormRow
                    label="Design Temperature (°C):"
                    placeholder="eg. 100"
                    name="design_temperature"
                    form={form}
                    setForm={setForm}
                    onChange={handleNumericChange}
                    error={errors.design_temperature}
                    options={options}
                  />
                </div>
              </div>

              {/* View Parts Section */}
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Additional View Parts</h3>
                <div className="flex flex-wrap gap-6">
                  {viewParts.map((part) => (
                    <div key={part.id} className="flex flex-col gap-2 relative group">
                      {/* Image Box */}
                      <div
                        className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors relative"
                        onClick={() => document.getElementById(`part-file-${part.id}`).click()}
                      >
                        {part.previewUrl || part.existingUrl ? (
                          <img
                            src={part.previewUrl || `http://localhost:8000${part.existingUrl}`}
                            alt="View Part"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <Plus className="mx-auto text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Add Photo</span>
                          </div>
                        )}

                        <input
                          type="file"
                          id={`part-file-${part.id}`}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handlePartImageChange(part.id, e.target.files[0])}
                        />
                      </div>

                      {/* Dropdown and Custom Input */}
                      <div className="flex flex-col gap-2">
                        <select
                          value={partViewOptions.includes(part.partView) ? part.partView : (part.partView ? "Other" : "")}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Other") {
                              handlePartChange(part.id, "partView", "Custom");
                            } else {
                              handlePartChange(part.id, "partView", val);
                            }
                          }}
                          className="w-40 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="" disabled>Select View</option>
                          {partViewOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>

                        {/* Custom Input */}
                        {(!partViewOptions.includes(part.partView) && part.partView !== "") && (
                          <input
                            type="text"
                            placeholder="Type Custom View..."
                            value={part.partView === "Custom" ? "" : part.partView} // clear "Custom" placeholder visual
                            onChange={(e) => handlePartChange(part.id, "partView", e.target.value)}
                            className="w-40 px-2 py-1 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemovePart(part.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add Button */}
                  <button
                    onClick={handleAddPart}
                    className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-colors text-blue-500"
                  >
                    <Plus size={32} />
                    <span className="font-semibold text-sm mt-2">Add Part</span>
                  </button>
                </div>
              </div>

              {/* Save button */}
              <div className="mt-16 flex flex-col items-center gap-2">
                <span className="text-red-700 text-base">
                  ***Please make sure the information inserted is correct before saving.
                </span>
                <button
                  onClick={handleSaveEquipment}
                  className="px-8 py-2 text-base font-semibold bg-blue-500 text-white border border-blue-500 rounded-lg shadow-sm hover:bg-blue-600"
                >
                  {editingId ? "Update" : "Save"}
                </button>
                {editingId && (
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditImageUrl(null);
                      setForm({
                        equipment_tag_no: "",
                        equipment_description: "",
                        plant_area: "",
                        dosh_registration_no: "",
                        type_id: "",
                        material: "",
                        nominal_thickness: "",
                        corrosion_allowance: "",
                        design_pressure: "",
                        design_temperature: "",
                        location: "",
                        status: "ACTIVE"
                      });
                      setViewParts([]);
                      setActiveTab("Equipment Registration"); // Switch back to registration
                    }}
                    className="px-8 py-2 text-base font-semibold bg-blue-500 text-white border border-blue-500 rounded-lg shadow-sm hover:bg-blue-600"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: Equipment Details */}
          {activeTab === "Equipment Details" && (
            <div className="w-full">
              {!viewingItem ? (
                /* LIST VIEW */
                <div className="w-full">
                  {/* Filter Section */}
                  <div className="flex flex-col gap-4 mb-6 bg-gray-50 p-6 rounded-lg border border-gray-200">

                    {/* Search Bar */}
                    <div className="relative w-full">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search equipment by tag, description, location, or DOSH no..."
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1); // Reset to first page on search
                        }}
                      />
                    </div>


                    <div className="flex flex-wrap items-center gap-4">
                      {/* Filter By Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-l text-black">Filtered by:</span>
                        <select
                          value={filterCategory}
                          onChange={(e) => {
                            setFilterCategory(e.target.value);
                            setFilterValue(""); // Reset value when category changes
                            setCurrentPage(1);
                          }}
                          className="px-4 py-2 bg-gray-300 text-black text-l rounded-full border-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
                        >
                          <option value="">Select your filter here</option>
                          <option value="type_id" disabled={activeFilters.some(f => f.category === "type_id")}>Type</option>
                          <option value="location" disabled={activeFilters.some(f => f.category === "location")}>Location</option>
                          <option value="status" disabled={activeFilters.some(f => f.category === "status")}>Status</option>
                        </select>
                      </div>

                      {/* Value Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-l text-black">Value:</span>
                        <select
                          value={filterValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFilterValue(val);
                            if (val && filterCategory) {
                              // Add to active filters if not already present
                              if (!activeFilters.some(f => f.category === filterCategory && f.value === val)) {
                                setActiveFilters([...activeFilters, { category: filterCategory, value: val }]);
                                setCurrentPage(1);
                              }
                              // Reset selection after adding
                              setFilterCategory("");
                              setFilterValue("");
                            }
                          }}
                          disabled={!filterCategory}
                          className="px-4 py-2 bg-gray-300 text-black text-l rounded-full border-none focus:ring-2 focus:ring-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select the value here</option>
                          {filterCategory === "type_id" && options.types.map(t => (
                            <option key={t.id} value={t.id}>{t.description}</option>
                          ))}
                          {filterCategory === "location" && [...new Set(equipmentList.map(item => item.location).filter(Boolean))].map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                          {filterCategory === "status" && ["ACTIVE", "INACTIVE", "MAINTENANCE"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {activeFilters.map((filter, index) => (
                        <div key={index} className="flex items-center gap-2 px-4 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-base font-medium tracking-wider">
                          <span>
                            {filter.category === "type_id" ? "Type" :
                              filter.category.charAt(0).toUpperCase() + filter.category.slice(1)}:
                            {filter.category === "type_id"
                              ? (options.types.find(t => t.id.toString() === filter.value.toString())?.description || filter.value)
                              : filter.value}
                          </span>
                          <button
                            onClick={() => {
                              setActiveFilters(activeFilters.filter((_, i) => i !== index));
                              setCurrentPage(1);
                            }}
                            className="hover:text-red-600 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {activeFilters.length > 0 && (
                        <button
                          onClick={() => {
                            setActiveFilters([]);
                            setCurrentPage(1);
                          }}
                          className="text-sm text-red-600 hover:underline self-center ml-2"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-300">
                      <thead className="text-base">
                        <tr className="bg-gray-100">
                          <th className="py-2 px-4 border-b text-center">Tag No</th>
                          <th className="py-2 px-4 border-b text-center">Description</th>
                          <th className="py-2 px-4 border-b text-center">Location</th>
                          <th className="py-2 px-4 border-b text-center">DOSH No</th>
                          <th className="py-2 px-4 border-b text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filteredItems = equipmentList
                            .filter(item => {
                              if (activeFilters.length === 0) return true;
                              return activeFilters.every(filter => {
                                if (filter.category === "type_id") {
                                  return item.type_id.toString() === filter.value.toString();
                                }
                                return item[filter.category] === filter.value;
                              });
                            })
                            .filter(item => {
                              if (!searchQuery) return true;
                              const query = searchQuery.toLowerCase();
                              return (
                                (item.equipment_tag_no && item.equipment_tag_no.toLowerCase().includes(query)) ||
                                (item.equipment_description && item.equipment_description.toLowerCase().includes(query)) ||
                                (item.location && item.location.toLowerCase().includes(query)) ||
                                (item.dosh_registration_no && item.dosh_registration_no.toLowerCase().includes(query))
                              );
                            });

                          // Pagination Logic
                          const indexOfLastItem = currentPage * itemsPerPage;
                          const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                          const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
                          const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

                          if (currentItems.length === 0 && filteredItems.length === 0) {
                            return (
                              <tr>
                                <td colSpan="5" className="py-4 text-center text-sm text-gray-500">
                                  No equipment found.
                                </td>
                              </tr>
                            );
                          }

                          if (currentItems.length === 0 && filteredItems.length > 0) {
                            // e.g. landed on empty page
                            return (
                              <tr>
                                <td colSpan="5" className="py-4 text-center text-sm text-gray-500">
                                  No items on this page.
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <>
                              {currentItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 text-base">
                                  <td className="py-2 px-4 border-b text-center">{highlightText(item.equipment_tag_no, searchQuery)}</td>
                                  <td className="py-2 px-4 border-b text-center">{highlightText(item.equipment_description, searchQuery)}</td>
                                  <td className="py-2 px-4 border-b text-center">{highlightText(item.location, searchQuery)}</td>
                                  <td className="py-2 px-4 border-b text-center">{highlightText(item.dosh_registration_no, searchQuery)}</td>
                                  <td className="py-2 px-4 border-b flex gap-2 justify-center">
                                    <button
                                      onClick={() => setViewingItem(item)}
                                      className="bg-green-500 text-white px-6 py-1 rounded hover:bg-green-600 font-semibold"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* Pagination Controls Row */}
                              {filteredItems.length > itemsPerPage && (
                                <tr>
                                  <td colSpan="5" className="py-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center px-4">
                                      <div className="text-sm text-gray-600">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredItems.length)} of {filteredItems.length} entries
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
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* READ-ONLY DETAILS VIEW */
                <div className="p-5 bg-[#f8f8f8] rounded-2xl shadow-lg">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left side - Image */}
                    <div className="w-full md:w-1/3 flex flex-col items-center pt-8">
                      <div className="w-full bg-gray-200 overflow-hidden border border-gray-300 rounded-lg min-h-[520px] flex items-center justify-center">
                        {/* Show equipment image if available in database, else show text */}
                        {viewingItem.image_url ? (
                          <img
                            src={`http://localhost:8000${viewingItem.image_url}`}
                            alt="Equipment"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-500 text-lg font-medium">
                            no image to be viewed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side - Details */}
                    <div className="flex-1 flex flex-col gap-4 justify-center items-center w-full">
                      <DetailsRow label="Equipment Tag No:" value={viewingItem.equipment_tag_no} />
                      <DetailsRow label="Equipment Description:" value={viewingItem.equipment_description} />
                      <DetailsRow label="Plant/Unit/Area:" value={viewingItem.location} />
                      <DetailsRow label="DOSH Registration No:" value={viewingItem.dosh_registration_no} />
                      <div className="h-1"></div>
                      <DetailsRow label="Type:" value={options.types.find(t => t.id === viewingItem.type_id)?.description || viewingItem.type_id} />
                      <DetailsRow label="Material:" value={options.materials.find(m => m.id === viewingItem.material_id)?.description || viewingItem.material_id || "-"} />
                      <DetailsRow label="Nominal Thickness (mm):" value={viewingItem.nominal_thickness} />
                      <DetailsRow label="Corrosion Allowance (mm):" value={viewingItem.corrosion_allowance} />
                      <DetailsRow label="Design Pressure (barg):" value={viewingItem.design_pressure} />
                      <DetailsRow label="Design Temperature (°C):" value={viewingItem.design_temperature} />

                      <div className="flex items-center gap-4 mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <span className="font-bold text-base text-gray-800">Status:</span>
                        <select
                          value={viewingItem.status || "ACTIVE"}
                          onChange={(e) => handleStatusUpdate(e.target.value)}
                          className={`px-4 py-2 rounded-lg font-bold text-white cursor-pointer border-none outline-none
                             ${viewingItem.status === "ACTIVE" ? "bg-green-500 hover:bg-green-600" :
                              viewingItem.status === "MAINTENANCE" ? "bg-orange-500 hover:bg-orange-600" :
                                "bg-gray-500 hover:bg-gray-600"}`}
                        >
                          <option value="ACTIVE" className="bg-white text-black">Active</option>
                          <option value="INACTIVE" className="bg-white text-black">Inactive</option>
                          <option value="MAINTENANCE" className="bg-white text-black">Maintenance</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Additional View Parts Gallery */}
                  {viewingItem.photos && viewingItem.photos.some(p => !["General", "General View"].includes(p.part_view)) && (
                    <div className="mt-8 px-4 w-full">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Additional Views</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {viewingItem.photos
                          .filter(p => !["General", "General View"].includes(p.part_view))
                          .map((photo) => {
                            const filename = photo.file_path ? photo.file_path.split(/[\\/]/).pop() : "";
                            return (
                              <div key={photo.id} className="flex flex-col items-center bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                                <div className="w-full h-40 bg-gray-100 rounded-md overflow-hidden mb-2">
                                  <img
                                    src={`http://localhost:8000/static/uploads/${filename}`}
                                    alt={photo.part_view}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                                    onClick={() => window.open(`http://localhost:8000/static/uploads/${filename}`, '_blank')}
                                  />
                                </div>
                                <span className="font-semibold text-sm text-gray-700">{photo.part_view || "Unknown View"}</span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="mt-12 flex flex-col items-center gap-4">
                    <button
                      onClick={() => handleEdit(viewingItem)}
                      className="px-8 py-2 text-base font-bold bg-blue-500 text-white rounded-xl shadow-md hover:bg-blue-600 transition-transform hover:scale-105"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setViewingItem(null)}
                      className="px-8 py-2 text-base font-bold bg-blue-500 text-white border border-blue-500 rounded-xl shadow-md hover:bg-blue-600 transition-transform hover:scale-105"
                    >
                      Back to List
                    </button>

                    <button
                      onClick={() => handleDelete(viewingItem.id)}
                      className="px-8 py-2 text-base font-bold bg-red-500 text-white rounded-xl shadow-md hover:bg-red-600 transition-transform hover:scale-105"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div >
    </div >
  );
}
