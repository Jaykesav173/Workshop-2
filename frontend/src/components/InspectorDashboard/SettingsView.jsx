import { useState, useEffect } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";

const API_BASE = "http://localhost:8000/api";

export function SettingsView() {

  // ---------------- STATES ----------------
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    phone_number: "",
    ic_number: "",
    date_of_birth: "",
    school_name: "",
    mother_name: ""
  });

  const [userId, setUserId] = useState(null);
  const [saving, setSaving] = useState(false);


  // ---------------- LOAD PROFILE ----------------
  useEffect(() => {

    const storedUser = localStorage.getItem("loggedInUser");
    if (!storedUser) return;

    const parsed = JSON.parse(storedUser);
    setUserId(parsed.id);

    axios.get(`${API_BASE}/users/${parsed.id}`)
      .then(res => {
        setForm(res.data.user);
      })
      .catch(err => {
        console.error("Profile fetch error:", err);
      });

  }, []);


  // ---------------- INPUT HANDLER ----------------
  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };


  // ---------------- SUBMIT HANDLER ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.name || !form.username || !form.email) {
      alert("Name, Username, and Email are required.");
      return;
    }

    try {
      setSaving(true);

      const res = await axios.put(
        `${API_BASE}/users/${userId}`,
        form
      );

      // Save updated user back to localStorage
      localStorage.setItem(
        "loggedInUser",
        JSON.stringify(res.data.user)
      );

      alert("✅ Profile updated successfully!");

    } catch (err) {
      console.error("Update error:", err);
      alert("❌ Failed to update profile");

    } finally {
      setSaving(false);
    }
  };


  // ---------------- RENDER ----------------
  return (
    <div className="max-w-4xl space-y-6">

      <Card>

        <CardHeader>
          <CardTitle>Personal Settings</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* -------- NAME / USERNAME -------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>

            </div>


            {/* -------- EMAIL -------- */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </div>


            {/* -------- PHONE -------- */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                type="tel"
                value={form.phone_number}
                onChange={handleChange}
              />
            </div>


            {/* -------- IC -------- */}
            <div className="space-y-2">
              <Label htmlFor="ic_number">IC Number</Label>
              <Input
                id="ic_number"
                value={form.ic_number}
                onChange={handleChange}
              />
            </div>


            {/* -------- DOB -------- */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
              />
            </div>


            {/* -------- SCHOOL -------- */}
            <div className="space-y-2">
              <Label htmlFor="school_name">School Name</Label>
              <Input
                id="school_name"
                value={form.school_name}
                onChange={handleChange}
              />
            </div>


            {/* -------- MOTHER -------- */}
            <div className="space-y-2">
              <Label htmlFor="mother_name">Mother's Name</Label>
              <Input
                id="mother_name"
                value={form.mother_name}
                onChange={handleChange}
              />
            </div>


            {/* -------- SAVE BUTTON -------- */}
            <Button
              type="submit"
              disabled={saving}
              className="mt-4"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>

          </form>
        </CardContent>

      </Card>

    </div>
  );
}
