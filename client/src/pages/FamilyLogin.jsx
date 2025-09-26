import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FamilyLogin = () => {
  const [familyId, setFamilyId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!familyId || !password) {
      setErr("Family ID and Password are required.");
      return;
    }

    setLoading(true);
    setErr("");
    try {
      const res = await axios.post(`${API_BASE}/api/family/login`, { familyId, password });
      localStorage.setItem("familyToken", res.data.token);
      localStorage.setItem("familyId", res.data.family.id);
      navigate("/family-dashboard");
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      setErr(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-green-700">Family Login</h2>

        {err && <p className="text-red-500 mb-3 text-center">{err}</p>}

        <input
          type="text"
          placeholder="Family ID"
          value={familyId}
          onChange={(e) => setFamilyId(e.target.value)}
          className="w-full border p-2 mb-3 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full px-4 py-2 rounded text-white ${loading ? "bg-green-400" : "bg-green-700 hover:bg-green-800"} transition`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default FamilyLogin;
