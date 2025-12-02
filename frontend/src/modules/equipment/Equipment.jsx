
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

// ---------------------------
// Form Row Component
// ---------------------------
const FormRow = React.memo(({ label, placeholder, type = "input", name, form, setForm, options, required }) => (
  <div className="flex items-center space-x-4 py-1">
    <label className="w-60 text-right font-bold text-base">
      {required && <span className="text-red-500 mr-1">*</span>}
      {label}
    </label>

    {type === "input" ? (
      <input
        type="text"
        placeholder={placeholder}
        value={form[name] || ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="flex-1 px-2 text-gray-700 focus:outline-none placeholder-gray-500 bg-input-bg h-10 rounded-md border border-gray-300"
      />
    ) : (
      <div className="relative flex-1">
        <select
          value={form[name] || ""}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="w-full px-2 text-gray-700 focus:outline-none bg-input-bg h-10 rounded-md appearance-none cursor-pointer border border-gray-300"
        >
          <option disabled value="">
            {placeholder}
          </option>
          {options.types.map((t) => (
            <option key={t.id} value={t.id}>{t.description}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown size={16} className="text-gray-700" />
        </div>
      </div>
    )}
  </div>
));

const DetailsRow = ({ label, value }) => (
  <div className="flex items-center mb-1 min-h-[34px]">
    <span className="min-w-[250px] text-right text-lg font-bold text-black mr-5 select-none">
      {label}
    </span>
    <div className="flex-1 max-w-xl min-h-[34px] bg-[#e9e9e9] rounded-md flex items-center px-3 text-lg text-[#333]">
      {value || "Value"}
    </div>
  </div>
);

const InstructionField = () => (
  <div className="mt-8 px-4">
    <div className="text-base font-normal text-black mb-4">
      Please insert the equipment number of the equipment that requires changes.
    </div>
    <div className="flex items-center gap-4">
      <span className="text-base font-bold text-black min-w-[152px]">
        Equipment Tag No:
      </span>
      <input
        type="text"
        placeholder="Value"
        className="w-[305px] h-8 bg-gray-300 rounded-xl px-4 text-base text-gray-700 placeholder-gray-500 shadow-inner"
      />
    </div>
  </div>
);

export default function EquipmentDetailsRegistration() {

  // ------------------------------------------------------
  // 🔹 States
  // ------------------------------------------------------
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Equipment Registration");
  const [options, setOptions] = useState({ types: [] });

  const [form, setForm] = useState({
    equipment_tag_no: "",
    equipment_description: "",
    plant_area: "", // Not in DB? "location"?
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
      // Validate Type ID
      if (!form.type_id) {
        alert("Please fill in all required fields.");
        return;
      }

      // Prepare payload
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

      // Reset form
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

      // If we were editing, maybe switch back to list?
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
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete equipment");
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


  //load dropdown list options
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

  // ------------------------------------------------------
  // 🔹 Helper Components
  // ------------------------------------------------------
  const menuItems = [
    editingId ? "Equipment Details Update" : "Equipment Registration",
    "Equipment Details",
  ];

  // ------------------------------------------------------
  // 🔹 RENDER UI
  // ------------------------------------------------------
  return (
    <div className="bg-white min-h-screen w-full font-sans text-black rounded-lg overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2 text-white bg-header-blue">
        <div className="text-xl font-bold">EQUIPMENT INFORMATION</div>
        <button className="p-1 hover:opacity-80">
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-0 space-x-0 border-b border-gray-300">
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
              text-sm px-4 py-1.5 font-medium transition-all duration-300
              ${activeTab === item
                ? "bg-white text-black border border-gray-300 border-b-white -mb-px scale-[1.02] shadow-sm z-10"
                : "text-white bg-tab-blue hover:scale-[1.05] hover:opacity-90"
              }
            `}
            style={{
              borderRadius: "4px 4px 0 0",
              marginRight: "1px",
            }}
          >
            {item}
          </button>
        ))}
        <div className="flex-1 border-b border-gray-300"></div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <div className="max-w-7xl mx-auto">

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
                      <div className="flex flex-col items-center text-gray-500">
                        <Upload size={64} className="opacity-30 mb-4" />
                        <span className="text-lg font-medium text-gray-600">Drag and drop an image here</span>
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
                    className="mt-4 px-3 py-1 text-sm bg-gray-300 rounded-lg hover:bg-gray-400"
                    onClick={() => document.getElementById("equipment-image").click()}
                  >
                    Insert Image from Files
                  </button>
                </div>

                {/* Right side - Form */}
                <div className="flex-1 flex flex-col gap-4 pt-8">
                  {[
                    { label: "Equipment Tag No:", placeholder: "Value", name: "equipment_tag_no", required: true },
                    { label: "Equipment Description:", placeholder: "Value", name: "equipment_description", required: true },
                    { label: "Plant/Unit/Area:", placeholder: "Value", name: "location", required: true },
                    { label: "DOSH Registration No:", placeholder: "Value", name: "dosh_registration_no", required: true },
                    { label: "", placeholder: "", type: "spacer" },
                    { label: "Type:", placeholder: "Select Type", type: "select", name: "type_id", required: true },
                    { label: "Material:", placeholder: "Material", name: "material" },
                    { label: "Nominal Thickness (mm):", placeholder: "Nominal Thickness", name: "nominal_thickness" },
                    { label: "Corrosion Allowance (mm):", placeholder: "Corrosion Allowance", name: "corrosion_allowance" },
                    { label: "Design Pressure (barg):", placeholder: "Design Pressure", name: "design_pressure" },
                    { label: "Design Temperature (°C):", placeholder: "Design Temperature", name: "design_temperature" },
                  ].map((field, index) =>
                    field.type === "spacer" ? (
                      <div key={index} className="h-1"></div>
                    ) : (
                      <FormRow key={field.label} {...field} form={form} setForm={setForm} options={options} />
                    )
                  )}
                </div>
              </div>

              {/* Save button */}
              <div className="mt-16 flex flex-col items-center gap-2">
                <span className="text-red-700 text-base">
                  ***Please make sure the information inserted is correct before saving.
                </span>
                <button
                  onClick={handleSaveEquipment}
                  className="px-10 py-2 text-base bg-gray-300 border border-gray-500 rounded-lg shadow-sm hover:bg-gray-400"
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
                    className="px-10 py-2 text-base bg-red-300 border border-red-500 rounded-lg shadow-sm hover:bg-red-400"
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
                  {/* 🔹 Filter Section */}
                  <div className="flex flex-col gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Filter By Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black">Filter by:</span>
                        <select
                          value={filterCategory}
                          onChange={(e) => {
                            setFilterCategory(e.target.value);
                            setFilterValue(""); // Reset value when category changes
                          }}
                          className="px-4 py-2 bg-gray-300 text-black rounded-full border-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
                        >
                          <option value="">Select your filter here</option>
                          <option value="type_id">Type</option>
                          <option value="location">Location</option>
                          <option value="status">Status</option>
                        </select>
                      </div>

                      {/* Value Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black">Value:</span>
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
                          className="px-4 py-2 bg-gray-300 text-black rounded-full border-none focus:ring-2 focus:ring-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

                    {/* Active Filters Chips */}
                    <div className="flex flex-wrap gap-2">
                      {activeFilters.map((filter, index) => (
                        <div key={index} className="flex items-center gap-2 px-4 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium tracking-wider">
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
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="py-2 px-4 border-b">Tag No</th>
                          <th className="py-2 px-4 border-b">Description</th>
                          <th className="py-2 px-4 border-b">Location</th>
                          <th className="py-2 px-4 border-b">DOSH No</th>
                          <th className="py-2 px-4 border-b">Actions</th>
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
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="py-2 px-4 border-b">{item.equipment_tag_no}</td>
                              <td className="py-2 px-4 border-b">{item.equipment_description}</td>
                              <td className="py-2 px-4 border-b">{item.location}</td>
                              <td className="py-2 px-4 border-b">{item.dosh_registration_no}</td>
                              <td className="py-2 px-4 border-b flex gap-2">
                                <button
                                  onClick={() => setViewingItem(item)}
                                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        {equipmentList.length === 0 && (
                          <tr>
                            <td colSpan="5" className="py-4 text-center text-gray-500">
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
                        {/* TODO: Show actual image if available */}
                        <img
                          src={viewingItem.image_url ? `http://localhost:8000${viewingItem.image_url}` : "image_633902.png"}
                          alt="Equipment"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Right side - Details */}
                    <div className="flex-1 flex flex-col gap-4 pt-8">
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
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="mt-16 flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleEdit(viewingItem)}
                      className="px-10 py-2 text-base bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setViewingItem(null)}
                      className="px-10 py-2 text-base bg-gray-300 border border-gray-500 rounded-lg shadow-sm hover:bg-gray-400"
                    >
                      Back to List
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
