import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  // ---------------- States ----------------
  const [families, setFamilies] = useState([]);
  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [history, setHistory] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newFamily, setNewFamily] = useState({});
  const [taxData, setTaxData] = useState({ month: "", amount: "", paid: false });
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [newEvent, setNewEvent] = useState({});
  const [newWorker, setNewWorker] = useState({});
  const [newHistory, setNewHistory] = useState({ content: { en: "", ta: "" } });
  const [galleryFile, setGalleryFile] = useState(null);
  const [newGallery, setNewGallery] = useState({ title: "", description: "" });

  // ---------------- Load Data ----------------
  const loadAll = async () => {
    try {
      const [familiesRes, eventsRes, workersRes, historyRes, galleryRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/families`, { headers }),
        axios.get(`${API_BASE}/api/admin/events`, { headers }),
        axios.get(`${API_BASE}/api/admin/workers`, { headers }),
        axios.get(`${API_BASE}/api/admin/history`, { headers }),
        axios.get(`${API_BASE}/api/admin/gallery`, { headers }),
      ]);
      setFamilies(familiesRes.data || []);
      setEvents(eventsRes.data || []);
      setWorkers(workersRes.data || []);
      setHistory(historyRes.data || []);
      setGallery(galleryRes.data || []);
    } catch (err) {
      console.error("Load error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (token) loadAll();
  }, [token]);

  // ---------------- Families ----------------
  const createFamily = async () => {
    if (!newFamily.familyId || !newFamily.password || !newFamily.leaderName || !newFamily.email)
      return alert("Family ID, Password, Leader Name, Email required");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/families`, newFamily, { headers });
      setNewFamily({});
      loadAll();
    } catch (err) {
      console.error("Create family error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const approveFamily = async (id, approved) => {
    try {
      await axios.post(`${API_BASE}/api/admin/families/approve`, { id, approved }, { headers });
      loadAll();
    } catch (err) {
      console.error("Approve error:", err.response?.data || err.message);
    }
  };

  // ---------------- Tax ----------------
  const toggleSelectFamily = (id) => {
    if (selectedFamilies.includes(id)) {
      setSelectedFamilies(selectedFamilies.filter((fid) => fid !== id));
    } else {
      setSelectedFamilies([...selectedFamilies, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFamilies([]);
      setSelectAll(false);
    } else {
      setSelectedFamilies(families.map((f) => f._id));
      setSelectAll(true);
    }
  };

  const addTax = async () => {
    if (!taxData.month || !taxData.amount) return alert("Month & amount required");
    if (!selectedFamilies.length) return alert("Select at least one family");
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/api/admin/families/tax/bulk`,
        { familyIds: selectedFamilies, ...taxData },
        { headers }
      );
      setTaxData({ month: "", amount: "", paid: false });
      setSelectedFamilies([]);
      setSelectAll(false);
      loadAll();
    } catch (err) {
      console.error("Add tax error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Events ----------------
  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return alert("Title & Date required");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/events`, newEvent, { headers });
      setNewEvent({});
      loadAll();
    } catch (err) {
      console.error("Add event error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
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
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/workers`, newWorker, { headers });
      setNewWorker({});
      loadAll();
    } catch (err) {
      console.error("Add worker error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
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
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/history`, newHistory, { headers });
      setNewHistory({ content: { en: "", ta: "" } });
      loadAll();
    } catch (err) {
      console.error("Add history error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
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
      setLoading(true);
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
    } finally {
      setLoading(false);
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

  // ---------------- Paid / Not Paid ----------------
  const paidFamilies = families.filter(
    (f) => f.taxHistory?.length && f.taxHistory[f.taxHistory.length - 1].paid
  );
  const unpaidFamilies = families.filter(
    (f) => f.taxHistory?.length && !f.taxHistory[f.taxHistory.length - 1].paid
  );

  // ---------------- Render ----------------
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center mb-6">Admin Dashboard</h1>
      {loading && <p className="text-center text-blue-600 font-semibold">Processing...</p>}

      {/* ---------------- Families / Tax ---------------- */}
      <div className="p-4 border rounded space-y-4">
        <h2 className="font-semibold text-lg">Families</h2>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-sm md:text-base">
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
                const latestTax = f.taxHistory?.length ? f.taxHistory[f.taxHistory.length - 1] : null;
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
        </div>

        {/* Add Tax */}
        <div className="flex flex-col md:flex-row flex-wrap gap-2 mt-3 items-center">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /> Select All
          </label>
          {families.map((f) => (
            <label key={f._id} className="flex items-center gap-1">
              <input type="checkbox" checked={selectedFamilies.includes(f._id)} onChange={() => toggleSelectFamily(f._id)} /> {f.familyId}
            </label>
          ))}
          <input type="month" value={taxData.month} onChange={(e) => setTaxData({ ...taxData, month: e.target.value })} className="border p-2" />
          <input placeholder="Amount" value={taxData.amount} onChange={(e) => setTaxData({ ...taxData, amount: e.target.value })} className="border p-2" />
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={taxData.paid} onChange={(e) => setTaxData({ ...taxData, paid: e.target.checked })} /> Paid
          </label>
          <button onClick={addTax} className="bg-green-600 text-white px-3 py-1 rounded">Add Tax</button>
        </div>

        {/* Paid / Not Paid Cards */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="border p-3 flex-1">
            <h3 className="font-semibold">Paid Families</h3>
            {paidFamilies.map((f) => (
              <p key={f._id}>{f.familyId} ({f.leaderName})</p>
            ))}
          </div>
          <div className="border p-3 flex-1">
            <h3 className="font-semibold">Not Paid Families</h3>
            {unpaidFamilies.map((f) => (
              <p key={f._id}>{f.familyId} ({f.leaderName})</p>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Events ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">Events</h2>
        <ul className="list-disc pl-6">
          {events.map((e) => (
            <li key={e._id} className="flex justify-between items-center flex-wrap">
              <span>{e.title} ({new Date(e.date).toLocaleDateString()})</span>
              <button onClick={() => deleteEvent(e._id)} className="text-red-600 underline ml-2">Delete</button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <input placeholder="Title" value={newEvent.title || ""} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="border p-2 flex-1" />
          <input type="date" value={newEvent.date || ""} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="border p-2" />
          <button onClick={addEvent} className="bg-green-600 text-white px-3 py-1 rounded">Add Event</button>
        </div>
      </div>

      {/* ---------------- Workers ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">Workers</h2>
        <ul className="list-disc pl-6">
          {workers.map((w) => (
            <li key={w._id} className="flex justify-between items-center flex-wrap">
              <span>{w.type}</span>
              <button onClick={() => deleteWorker(w._id)} className="text-red-600 underline ml-2">Delete</button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <input placeholder="Worker Type" value={newWorker.type || ""} onChange={(e) => setNewWorker({ ...newWorker, type: e.target.value })} className="border p-2 flex-1" />
          <button onClick={addWorker} className="bg-green-600 text-white px-3 py-1 rounded">Add Worker</button>
        </div>
      </div>

      {/* ---------------- History ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">History</h2>
        <ul className="list-disc pl-6">
          {history.map((h) => (
            <li key={h._id} className="flex justify-between items-center flex-wrap">
              <span>{h.content?.en || h.content?.ta}</span>
              <button onClick={() => deleteHistory(h._id)} className="text-red-600 underline ml-2">Delete</button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <input placeholder="Content EN" value={newHistory.content.en || ""} onChange={(e) => setNewHistory({ content: { ...newHistory.content, en: e.target.value } })} className="border p-2 flex-1" />
          <input placeholder="Content TA" value={newHistory.content.ta || ""} onChange={(e) => setNewHistory({ content: { ...newHistory.content, ta: e.target.value } })} className="border p-2 flex-1" />
          <button onClick={addHistory} className="bg-green-600 text-white px-3 py-1 rounded">Add History</button>
        </div>
      </div>

      {/* ---------------- Gallery ---------------- */}
      <div className="p-4 border rounded space-y-3">
        <h2 className="font-semibold text-lg">Gallery</h2>
        <ul className="list-disc pl-6">
          {gallery.map((g) => (
            <li key={g._id} className="flex justify-between items-center flex-wrap">
              <span>{g.title}</span>
              <button onClick={() => deleteGallery(g._id)} className="text-red-600 underline ml-2">Delete</button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2 mt-2 items-center">
          <input type="file" onChange={(e) => setGalleryFile(e.target.files[0])} className="border p-2 flex-1" />
          <input placeholder="Title" value={newGallery.title} onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })} className="border p-2 flex-1" />
          <input placeholder="Description" value={newGallery.description} onChange={(e) => setNewGallery({ ...newGallery, description: e.target.value })} className="border p-2 flex-1" />
          <button onClick={uploadGallery} className="bg-green-600 text-white px-3 py-1 rounded">Upload</button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
