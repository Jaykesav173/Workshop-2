import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SecurityQuestions() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [school, setSchool] = useState("");
  const [motherName, setMotherName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!state?.email) {
    navigate("/forgot-password");
    return null;
  }

  const { email } = state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify_security_questions`, {  // You need backend for this
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, school_name: school, mother_name: motherName }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Navigate to OTP verification page
        navigate("/recover/otp", { state: { email } });
      } else {
        alert(data.detail || "Incorrect answers");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2>Security Questions</h2>
      <input placeholder="Primary School" value={school} onChange={e => setSchool(e.target.value)} required />
      <input placeholder="Mother Maiden Name" value={motherName} onChange={e => setMotherName(e.target.value)} required />
      <button type="submit" disabled={loading}>{loading ? "Verifying..." : "Next"}</button>
    </form>
  );
}
