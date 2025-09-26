import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/admin/login", { username, password });
      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin-dashboard");
    } catch (err) {
      setErr(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handle} className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>
        {err && <p className="text-red-500 mb-2">{err}</p>}
        <input className="w-full p-2 border mb-3 rounded" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" />
        <input type="password" className="w-full p-2 border mb-3 rounded" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        <button className="bg-green-700 text-white px-4 py-2 rounded w-full">Login</button>
      </form>
    </div>
  );
};

export default AdminLogin;
