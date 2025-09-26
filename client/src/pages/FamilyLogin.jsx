import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FamilyLogin = () => {
  const [familyId, setFamilyId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/family/login", { familyId, password });
      localStorage.setItem("familyToken", res.data.token);
      localStorage.setItem("familyId", res.data.family.id);
      navigate("/family-dashboard");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setErr(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Family Login</h2>
        {err && <p className="text-red-500 mb-2">{err}</p>}
        <input value={familyId} onChange={e=>setFamilyId(e.target.value)} placeholder="Family ID" className="w-full border p-2 mb-3 rounded" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border p-2 mb-3 rounded" />
        <button className="bg-green-700 text-white px-4 py-2 rounded w-full">Login</button>
      </form>
    </div>
  );
};

export default FamilyLogin;
