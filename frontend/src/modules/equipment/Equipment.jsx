
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronDown, Upload } from "lucide-react";

import {
  createEquipment,
  uploadEquipmentImage,
  getAllEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentById,
  getEquipmentOptions
} from "./equipmentApi.jsx";

// Form Row Component
const FormRow = React.memo(({ label, placeholder, type = "input", name, form, setForm, options, required, className }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-sm font-bold text-gray-800">
      {required && <span className="text-red-500 mr-1">*</span>}
      {label}
    </label>

    {type === "input" ? (
      <input
        type="text"
        placeholder={placeholder}
        value={form[name] || ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full px-3 text-base text-gray-800 focus:outline-none placeholder-gray-500 bg-white h-10 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    ) : (
      <div className="relative w-full">
        <select
          value={form[name] || ""}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="w-full px-3 text-base text-gray-800 focus:outline-none bg-white h-10 rounded-lg appearance-none cursor-pointer border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option disabled value="">
            {placeholder}
          </option>
          {options.types.map((t) => (
            <option key={t.id} value={t.id}>{t.description}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown size={18} className="text-gray-500" />
        </div>
      </div>
    )}
  </div>
));

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

const InstructionField = () => (
  <div className="mt-8 px-4">
    <div className="text-sm font-normal text-black mb-4">
      Please insert the equipment number of the equipment that requires changes.
    </div>
    <div className="flex items-center gap-4">
      <span className="text-sm font-bold text-black min-w-[152px]">
        Equipment Tag No:
      </span>
      <input
        type="text"
        placeholder="Value"
        className="w-[305px] h-9 bg-gray-300 rounded-xl px-4 text-sm text-gray-700 placeholder-gray-500 shadow-inner"
      />
    </div>
  </div>
);

export default function EquipmentDetailsRegistration() {

  // States
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Equipment Registration");
  const [options, setOptions] = useState({ types: [] });

  const [form, setForm] = useState({
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

  const [imageFile, setImageFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [equipmentList, setEquipmentList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);

  // Filter State
  const [filterCategory, setFilterCategory] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [activeFilters, setActiveFilters] = useState([]); // Array of { category, value }

  const token = localStorage.getItem("token");

  // loads equipment list 
  useEffect(() => {
    if (activeTab === "Equipment Details") {
      loadAllEquipment();
    }
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

  // to save the equipment information (display warning if press save button without filing the information)
  async function handleSaveEquipment() {
    try {
      if (!form.equipment_tag_no || !form.equipment_description || !form.plant_area || !form.dosh_registration_no || !form.type_id) {
        alert("Please fill in all required fields.");
        return;
      }

      const payload = {
        ...form,
        type_id: parseInt(form.type_id),
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
        await uploadEquipmentImage(equipmentId, imageFile, token);
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
      setImageFile(null);
      setEditingId(null);

      if (editingId) {
        setActiveTab("Equipment Details");
        loadAllEquipment();
      }

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
      loadAllEquipment();
      setViewingItem(null); // Close details view if open
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
        type_id: parseInt(viewingItem.type_id), // Ensure correct type
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
      loadAllEquipment(); // Refresh list in background
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
      material: item.material,
      nominal_thickness: item.nominal_thickness,
      corrosion_allowance: item.corrosion_allowance,
      design_pressure: item.design_pressure,
      design_temperature: item.design_temperature,
      status: item.status || "ACTIVE"
    });
    setEditingId(item.id);
    setActiveTab("Equipment Details Update");
  }


  // load dropdown list options
  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      const res = await getEquipmentOptions(token);
      setOptions({ types: res.data.types }); // Expecting [{id, description}, ...]
    } catch (err) {
      console.error("Failed to load options", err);
    }
  }

  // Helper Components
  const menuItems = [
    editingId ? "Equipment Details Update" : "Equipment Registration",
    "Equipment Details",
  ];

  // RENDER UI
  return (

    <div className="bg-white min-h-screen font-sans text-black ml-[250px] mt-[80px]">

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
                    ) : (
                      <div className="flex flex-col text-center items-center text-gray-500">
                        <Upload size={48} className="opacity-30 mb-2" />
                        <span className="text-base font-medium text-gray-600">Drag and drop an image here</span>
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
                    Insert Image from Files
                  </button>
                </div>

                {/* Right side - Form */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                  <FormRow label="Equipment Tag No:" placeholder="Value" name="equipment_tag_no" form={form} setForm={setForm} options={options} required />
                  <FormRow label="Plant/Unit/Area:" placeholder="Value" name="location" form={form} setForm={setForm} options={options} required />

                  <FormRow label="Equipment Description:" placeholder="Value" name="equipment_description" form={form} setForm={setForm} options={options} required className="md:col-span-2" />

                  <FormRow label="DOSH Registration No:" placeholder="Value" name="dosh_registration_no" form={form} setForm={setForm} options={options} required />
                  <FormRow label="Type:" placeholder="Select Type" type="select" name="type_id" form={form} setForm={setForm} options={options} required />

                  <div className="md:col-span-2 h-px bg-gray-200 my-2"></div>

                  <FormRow label="Material:" placeholder="Material" name="material" form={form} setForm={setForm} options={options} />
                  <FormRow label="Nominal Thickness (mm):" placeholder="Value" name="nominal_thickness" form={form} setForm={setForm} options={options} />

                  <FormRow label="Corrosion Allowance (mm):" placeholder="Value" name="corrosion_allowance" form={form} setForm={setForm} options={options} />
                  <FormRow label="Design Pressure (barg):" placeholder="Value" name="design_pressure" form={form} setForm={setForm} options={options} />

                  <FormRow label="Design Temperature (°C):" placeholder="Value" name="design_temperature" form={form} setForm={setForm} options={options} />
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
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Filter By Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-l text-black">Filter by:</span>
                        <select
                          value={filterCategory}
                          onChange={(e) => {
                            setFilterCategory(e.target.value);
                            setFilterValue(""); // Reset value when category changes
                          }}
                          className="px-4 py-2 bg-gray-300 text-black text-l rounded-full border-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
                        >
                          <option value="">Select your filter here</option>
                          <option value="type_id">Type</option>
                          <option value="location">Location</option>
                          <option value="status">Status</option>
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
                            onClick={() => setActiveFilters(activeFilters.filter((_, i) => i !== index))}
                            className="hover:text-red-600 font-bold"
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
                        {equipmentList
                          .filter(item => {
                            if (activeFilters.length === 0) return true;
                            // AND logic: item must match ALL active filters
                            return activeFilters.every(filter => {
                              if (filter.category === "type_id") {
                                return item.type_id.toString() === filter.value.toString();
                              }
                              return item[filter.category] === filter.value;
                            });
                          })
                          .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 text-base">
                              <td className="py-2 px-4 border-b text-center">{item.equipment_tag_no}</td>
                              <td className="py-2 px-4 border-b text-center">{item.equipment_description}</td>
                              <td className="py-2 px-4 border-b text-center">{item.location}</td>
                              <td className="py-2 px-4 border-b text-center">{item.dosh_registration_no}</td>
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
                        {equipmentList.length === 0 && (
                          <tr>
                            <td colSpan="5" className="py-4 text-center text-sm text-gray-500">
                              No equipment found.
                            </td>
                          </tr>
                        )}
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
                        {/* Show equipment image if available in database*/}
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
                      <DetailsRow label="Material:" value={viewingItem.material} />
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

        </div >
      </div >
    </div >
  );
}
