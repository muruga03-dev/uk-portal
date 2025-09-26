import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  // ---------------- State ----------------
  const [families, setFamilies] = useState([]);
  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [history, setHistory] = useState([]);
  const [gallery, setGallery] = useState([]);

  // Forms
  const [newFamily, setNewFamily] = useState({});
  const [taxData, setTaxData] = useState({ familyId: "", month: "", amount: "" });
  const [newEvent, setNewEvent] = useState({});
  const [newWorker, setNewWorker] = useState({});
  const [newHistory, setNewHistory] = useState({ content: { en: "", ta: "" } });
  const [galleryFile, setGalleryFile] = useState(null);
  const [newGallery, setNewGallery] = useState({ title: "", description: "" });

  // ---------------- Load All Data ----------------
  const loadAll = async () => {
    try {
      const [familiesRes, eventsRes, workersRes, historyRes, galleryRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/families`, { headers }),
        axios.get(`${API_BASE}/api/admin/events`, { headers }),
        axios.get(`${API_BASE}/api/admin/workers`, { headers }),
        axios.get(`${API_BASE}/api/admin/history`, { headers }),
        axios.get(`${API_BASE}/api/admin/gallery`, { headers }),
      ]);
      setFamilies(familiesRes.data);
      setEvents(eventsRes.data);
      setWorkers(workersRes.data);
      setHistory(historyRes.data);
      setGallery(galleryRes.data);
    } catch (err) {
      console.error("Error loading data:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ---------------- Families ----------------
  const createFamily = async () => {
    if (!newFamily.familyId || !newFamily.password || !newFamily.leaderName || !newFamily.email) {
      return alert("Family ID, Password, Leader Name, and Email are required");
    }
    try {
      await axios.post(`${API_BASE}/api/admin/families`, newFamily, { headers });
      setNewFamily({});
      loadAll();
    } catch (err) {
      console.error("Create family error:", err.response?.data || err.message);
    }
  };

  const approveFamily = async (id, approved) => {
    try {
      await axios.post(`${API_BASE}/api/admin/families/approve`, { id, approved }, { headers });
      loadAll();
    } catch (err) {
      console.error("Approve family error:", err.response?.data || err.message);
    }
  };

  const addTax = async () => {
    if (!taxData.familyId || !taxData.month || !taxData.amount) return alert("All tax fields are required");
    try {
      await axios.post(`${API_BASE}/api/admin/families/tax`, taxData, { headers });
      setTaxData({ familyId: "", month: "", amount: "" });
      loadAll();
    } catch (err) {
      console.error("Add tax error:", err.response?.data || err.message);
    }
  };

  // ---------------- Events ----------------
  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return alert("Title and Date required");
    try {
      await axios.post(`${API_BASE}/api/admin/events`, newEvent, { headers });
      setNewEvent({});
      loadAll();
    } catch (err) {
      console.error("Add event error:", err.response?.data || err.message);
    }
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/events/${id}`, { headers });
      loadAll();
    } catch (err) {
      console.error("Delete event error:", err.response?.data || err.message);
    }
  };

  // ---------------- Workers ----------------
  const addWorker = async () => {
    if (!newWorker.type) return alert("Worker type required");
    try {
      await axios.post(`${API_BASE}/api/admin/workers`, newWorker, { headers });
      setNewWorker({});
      loadAll();
    } catch (err) {
      console.error("Add worker error:", err.response?.data || err.message);
    }
  };

  const deleteWorker = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/workers/${id}`, { headers });
      loadAll();
    } catch (err) {
      console.error("Delete worker error:", err.response?.data || err.message);
    }
  };

  // ---------------- History ----------------
  const addHistory = async () => {
    if (!newHistory.content?.en && !newHistory.content?.ta) return alert("History content required");
    try {
      await axios.post(`${API_BASE}/api/admin/history`, newHistory, { headers });
      setNewHistory({ content: { en: "", ta: "" } });
      loadAll();
    } catch (err) {
      console.error("Add history error:", err.response?.data || err.message);
    }
  };

  const deleteHistory = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/history/${id}`, { headers });
      loadAll();
    } catch (err) {
      console.error("Delete history error:", err.response?.data || err.message);
    }
  };

  // ---------------- Gallery ----------------
  const uploadGallery = async () => {
    if (!galleryFile) return alert("Select a file");
    try {
      const formData = new FormData();
      formData.append("image", galleryFile);
      formData.append("title", newGallery.title || "Untitled");
      formData.append("description", newGallery.description || "");

      await axios.post(`${API_BASE}/api/admin/gallery/upload`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });

      setGalleryFile(null);
      setNewGallery({ title: "", description: "" });
      loadAll();
    } catch (err) {
      console.error("Upload gallery error:", err.response?.data || err.message);
    }
  };

  const deleteGallery = async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/admin/gallery/${id}`, { headers });
      loadAll();
    } catch (err) {
      console.error("Delete gallery error:", err.response?.data || err.message);
    }
  };

  // ---------------- Render ----------------
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center mb-6">Admin Dashboard</h1>

      {/* ---------------- Families ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">Families</h2>
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Leader</th>
              <th className="border p-2">Approved</th>
              <th className="border p-2">Tax Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {families.map((f) => {
              const latestTax = f.tax?.length ? f.tax[f.tax.length - 1] : null;
              return (
                <tr key={f._id}>
                  <td className="border p-2">{f.familyId}</td>
                  <td className="border p-2">{f.leaderName}</td>
                  <td className="border p-2">{f.approved ? "Yes" : "No"}</td>
                  <td className="border p-2">
                    {latestTax ? (latestTax.paid ? `Paid (${latestTax.amount})` : `Unpaid (${latestTax.amount})`) : "No Tax"}
                  </td>
                  <td className="border p-2 space-x-2">
                    <button onClick={() => approveFamily(f._id, true)} className="bg-green-600 text-white px-2 py-1 rounded">Approve</button>
                    <button onClick={() => approveFamily(f._id, false)} className="bg-red-600 text-white px-2 py-1 rounded">Reject</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Create Family Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          <input placeholder="Family ID" value={newFamily.familyId || ""} onChange={(e) => setNewFamily({ ...newFamily, familyId: e.target.value })} className="border p-2" />
          <input placeholder="Password" type="password" value={newFamily.password || ""} onChange={(e) => setNewFamily({ ...newFamily, password: e.target.value })} className="border p-2" />
          <input placeholder="Leader Name" value={newFamily.leaderName || ""} onChange={(e) => setNewFamily({ ...newFamily, leaderName: e.target.value })} className="border p-2" />
          <input placeholder="Email" value={newFamily.email || ""} onChange={(e) => setNewFamily({ ...newFamily, email: e.target.value })} className="border p-2" />
          <input placeholder="Members (comma separated)" value={newFamily.members || ""} onChange={(e) => setNewFamily({ ...newFamily, members: e.target.value.split(",") })} className="border p-2" />
          <input placeholder="Address" value={newFamily.address || ""} onChange={(e) => setNewFamily({ ...newFamily, address: e.target.value })} className="border p-2" />
          <input placeholder="Phone" value={newFamily.phone || ""} onChange={(e) => setNewFamily({ ...newFamily, phone: e.target.value })} className="border p-2" />
        </div>
        <button onClick={createFamily} className="bg-indigo-600 text-white px-3 py-1 rounded mt-2">Create Family</button>

        {/* Add Tax Form */}
        <div className="flex flex-wrap gap-2 mt-3">
          <select value={taxData.familyId} onChange={(e) => setTaxData({ ...taxData, familyId: e.target.value })} className="border p-2">
            <option value="">Select Family</option>
            {families.map((f) => <option key={f._id} value={f._id}>{f.familyId}</option>)}
          </select>
          <input type="month" value={taxData.month} onChange={(e) => setTaxData({ ...taxData, month: e.target.value })} className="border p-2" />
          <input placeholder="Amount" value={taxData.amount} onChange={(e) => setTaxData({ ...taxData, amount: e.target.value })} className="border p-2" />
          <button onClick={addTax} className="bg-green-600 text-white px-3 py-1 rounded">Add Tax</button>
        </div>
      </div>

      {/* ---------------- Events ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">Events</h2>
        <ul className="list-disc pl-6">
          {events.map((e) => (
            <li key={e._id} className="flex justify-between items-center">
              <span>{e.title} ({new Date(e.date).toLocaleDateString()})</span>
              <button onClick={() => deleteEvent(e._id)} className="text-red-600 underline">Delete</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <input placeholder="Title" value={newEvent.title || ""} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="border p-2" />
          <input type="date" value={newEvent.date || ""} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="border p-2" />
          <button onClick={addEvent} className="bg-green-600 text-white px-3 py-1 rounded">Add Event</button>
        </div>
      </div>

      {/* ---------------- Workers ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">Workers</h2>
        <ul className="list-disc pl-6">
          {workers.map((w) => (
            <li key={w._id} className="flex justify-between items-center">
              <span>{w.type}</span>
              <button onClick={() => deleteWorker(w._id)} className="text-red-600 underline">Delete</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <input placeholder="Worker Type" value={newWorker.type || ""} onChange={(e) => setNewWorker({ ...newWorker, type: e.target.value })} className="border p-2" />
          <button onClick={addWorker} className="bg-green-600 text-white px-3 py-1 rounded">Add Worker</button>
        </div>
      </div>

      {/* ---------------- History ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">History</h2>
        <ul className="list-disc pl-6">
          {history.map((h) => (
            <li key={h._id} className="flex justify-between items-center">
              <span>{h.content.en || h.content.ta}</span>
              <button onClick={() => deleteHistory(h._id)} className="text-red-600 underline">Delete</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2">
          <input placeholder="Content EN" value={newHistory.content.en || ""} onChange={(e) => setNewHistory({ content: { ...newHistory.content, en: e.target.value } })} className="border p-2" />
          <input placeholder="Content TA" value={newHistory.content.ta || ""} onChange={(e) => setNewHistory({ content: { ...newHistory.content, ta: e.target.value } })} className="border p-2" />
          <button onClick={addHistory} className="bg-green-600 text-white px-3 py-1 rounded">Add History</button>
        </div>
      </div>

      {/* ---------------- Gallery ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">Gallery</h2>
        <ul className="list-disc pl-6">
          {gallery.map((g) => (
            <li key={g._id} className="flex justify-between items-center">
              <span>{g.title}</span>
              <button onClick={() => deleteGallery(g._id)} className="text-red-600 underline">Delete</button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 mt-2 items-center">
          <input type="file" onChange={(e) => setGalleryFile(e.target.files[0])} className="border p-2" />
          <input placeholder="Title" value={newGallery.title} onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })} className="border p-2" />
          <input placeholder="Description" value={newGallery.description} onChange={(e) => setNewGallery({ ...newGallery, description: e.target.value })} className="border p-2" />
          <button onClick={uploadGallery} className="bg-green-600 text-white px-3 py-1 rounded">Upload</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
