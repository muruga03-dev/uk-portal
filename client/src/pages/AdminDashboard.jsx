import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  const [families, setFamilies] = useState([]);
  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [history, setHistory] = useState([]);
  const [gallery, setGallery] = useState([]);

  // Forms
  const [newFamily, setNewFamily] = useState({});
  const [newEvent, setNewEvent] = useState({});
  const [newWorker, setNewWorker] = useState({});
  const [newHistory, setNewHistory] = useState({});
  const [galleryFile, setGalleryFile] = useState(null);
  const [newGallery, setNewGallery] = useState({ title: "", description: "" });
  const [taxData, setTaxData] = useState({ familyId: "", month: "", amount: "" });

  // ---------------- Load All Data ----------------
  const loadAll = async () => {
    try {
      const [familiesRes, eventsRes, workersRes, historyRes, galleryRes] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/families", { headers }),
        axios.get("http://localhost:5000/api/admin/events", { headers }),
        axios.get("http://localhost:5000/api/admin/workers", { headers }),
        axios.get("http://localhost:5000/api/admin/history", { headers }),
        axios.get("http://localhost:5000/api/admin/gallery", { headers })
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

  useEffect(() => { loadAll(); }, []);

  // ---------------- Families ----------------
  const createFamily = async () => {
    if (!newFamily.familyId || !newFamily.password || !newFamily.leaderName || !newFamily.email) {
      return alert("Family ID, Password, Leader Name, and Email are required");
    }
    try {
      await axios.post("http://localhost:5000/api/admin/families", newFamily, { headers });
      setNewFamily({});
      loadAll();
    } catch (err) { console.error("Create family error:", err.response?.data || err.message); }
  };

  const approveFamily = async (id, approved) => {
    try {
      await axios.post("http://localhost:5000/api/admin/families/approve", { id, approved }, { headers });
      loadAll();
    } catch (err) { console.error("Approve family error:", err.response?.data || err.message); }
  };

  const addTax = async () => {
    if (!taxData.familyId || !taxData.month || !taxData.amount) return alert("All tax fields are required");
    try {
      await axios.post("http://localhost:5000/api/admin/families/tax", taxData, { headers });
      setTaxData({ familyId: "", month: "", amount: "" });
      loadAll();
    } catch (err) { console.error("Add tax error:", err.response?.data || err.message); }
  };

  // ---------------- Events ----------------
  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;
    try {
      await axios.post("http://localhost:5000/api/admin/events", newEvent, { headers });
      setNewEvent({});
      loadAll();
    } catch (err) { console.error("Add event error:", err.response?.data || err.message); }
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/events/${id}`, { headers });
      loadAll();
    } catch (err) { console.error("Delete event error:", err.response?.data || err.message); }
  };

  // ---------------- Workers ----------------
  const addWorker = async () => {
    if (!newWorker.type) return;
    try {
      await axios.post("http://localhost:5000/api/admin/workers", newWorker, { headers });
      setNewWorker({});
      loadAll();
    } catch (err) { console.error("Add worker error:", err.response?.data || err.message); }
  };

  const deleteWorker = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/workers/${id}`, { headers });
      loadAll();
    } catch (err) { console.error("Delete worker error:", err.response?.data || err.message); }
  };

  // ---------------- History ----------------
  const addHistory = async () => {
    if (!newHistory.content?.en && !newHistory.content?.ta) return;
    try {
      await axios.post("http://localhost:5000/api/admin/history", newHistory, { headers });
      setNewHistory({});
      loadAll();
    } catch (err) { console.error("Add history error:", err.response?.data || err.message); }
  };

  const deleteHistory = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/history/${id}`, { headers });
      loadAll();
    } catch (err) { console.error("Delete history error:", err.response?.data || err.message); }
  };

  // ---------------- Gallery ----------------
  const uploadGallery = async () => {
    if (!galleryFile) return alert("Select a file");
    try {
      const formData = new FormData();
      formData.append("image", galleryFile); // Must match backend multer field name
      formData.append("title", newGallery.title || "Untitled");
      formData.append("description", newGallery.description || "");

      await axios.post(
        "http://localhost:5000/api/admin/gallery/upload", // Correct endpoint
        formData,
        { headers: { ...headers, "Content-Type": "multipart/form-data" } }
      );

      setGalleryFile(null);
      setNewGallery({ title: "", description: "" });
      loadAll();
    } catch (err) {
      console.error("Upload gallery error:", err.response?.data || err.message);
    }
  };

  const deleteGallery = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/gallery/${id}`, { headers });
      loadAll();
    } catch (err) {
      console.error("Delete gallery error:", err.response?.data || err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      {/* Families, Events, Workers, History sections remain unchanged */}
      {/* Families */} <div className="p-4 border rounded"> <h2 className="font-semibold mb-2">Families</h2> <table className="w-full border mb-4"> <thead> <tr className="bg-gray-100"> <th className="p-2">Family ID</th> <th className="p-2">Leader</th> <th className="p-2">Approved</th> <th className="p-2">Actions</th> </tr> </thead> <tbody> {families.map(f => ( <tr key={f._id}> <td className="p-2">{f.familyId}</td> <td className="p-2">{f.leaderName}</td> <td className="p-2">{f.approved ? "Yes" : "No"}</td> <td className="p-2 space-x-2"> <button onClick={() => approveFamily(f._id, true)} className="bg-green-600 text-white px-2 py-1 rounded">Approve</button> <button onClick={() => approveFamily(f._id, false)} className="bg-red-600 text-white px-2 py-1 rounded">Reject</button> </td> </tr> ))} </tbody> </table> <h3 className="font-semibold mt-4">Create Family</h3> <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2"> <input placeholder="Family ID" value={newFamily.familyId || ""} onChange={e => setNewFamily({ ...newFamily, familyId: e.target.value })} className="border p-2" /> <input placeholder="Password" type="password" value={newFamily.password || ""} onChange={e => setNewFamily({ ...newFamily, password: e.target.value })} className="border p-2" /> <input placeholder="Leader Name" value={newFamily.leaderName || ""} onChange={e => setNewFamily({ ...newFamily, leaderName: e.target.value })} className="border p-2" /> <input placeholder="Members (comma separated)" value={newFamily.members || ""} onChange={e => setNewFamily({ ...newFamily, members: e.target.value.split(",") })} className="border p-2" /> <input placeholder="Address" value={newFamily.address || ""} onChange={e => setNewFamily({ ...newFamily, address: e.target.value })} className="border p-2" /> <input placeholder="Email" value={newFamily.email || ""} onChange={e => setNewFamily({ ...newFamily, email: e.target.value })} className="border p-2" /> <input placeholder="Phone" value={newFamily.phone || ""} onChange={e => setNewFamily({ ...newFamily, phone: e.target.value })} className="border p-2" /> </div> <button onClick={createFamily} className="bg-indigo-600 text-white px-3 py-1 rounded">Create Family</button> <h3 className="font-semibold mt-4">Add Tax</h3> <div className="flex gap-2 mb-2"> <select value={taxData.familyId} onChange={e => setTaxData({ ...taxData, familyId: e.target.value })} className="border p-2"> <option value="">Select Family</option> {families.map(f => <option key={f._id} value={f._id}>{f.familyId}</option>)} </select> <input type="month" value={taxData.month} onChange={e => setTaxData({ ...taxData, month: e.target.value })} className="border p-2" /> <input placeholder="Amount" value={taxData.amount} onChange={e => setTaxData({ ...taxData, amount: e.target.value })} className="border p-2" /> <button onClick={addTax} className="bg-green-600 text-white px-3 py-1 rounded">Add Tax</button> </div> </div> {/* Events */} <div className="p-4 border rounded"> <h2 className="font-semibold mb-2">Events</h2> <div className="flex gap-2 mb-2"> <input placeholder="Title" value={newEvent.title || ""} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="border p-2" /> <input type="date" value={newEvent.date || ""} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="border p-2" /> <button onClick={addEvent} className="bg-blue-600 text-white px-3 py-1 rounded">Add Event</button> </div> <ul> {events.map(ev => ( <li key={ev._id} className="flex justify-between border-b p-1"> {ev.title} ({new Date(ev.date).toLocaleDateString()}) <button onClick={() => deleteEvent(ev._id)} className="text-red-600">Delete</button> </li> ))} </ul> </div> {/* Workers */} <div className="p-4 border rounded"> <h2 className="font-semibold mb-2">Workers</h2> <div className="flex gap-2 mb-2"> <input placeholder="Type" value={newWorker.type || ""} onChange={e => setNewWorker({ ...newWorker, type: e.target.value })} className="border p-2" /> <button onClick={addWorker} className="bg-blue-600 text-white px-3 py-1 rounded">Add Worker</button> </div> <ul> {workers.map(w => ( <li key={w._id} className="flex justify-between border-b p-1"> {w.type} <button onClick={() => deleteWorker(w._id)} className="text-red-600">Delete</button> </li> ))} </ul> </div> {/* History */} <div className="p-4 border rounded"> <h2 className="font-semibold mb-2">History</h2> <input placeholder="EN Content" value={newHistory.content?.en || ""} onChange={e => setNewHistory({ content: { ...(newHistory.content || {}), en: e.target.value } })} className="border p-2 mb-2 w-full" /> <input placeholder="TA Content" value={newHistory.content?.ta || ""} onChange={e => setNewHistory({ content: { ...(newHistory.content || {}), ta: e.target.value } })} className="border p-2 mb-2 w-full" /> <button onClick={addHistory} className="bg-blue-600 text-white px-3 py-1 rounded mb-2">Add History</button> <ul> {history.map(h => ( <li key={h._id} className="flex justify-between border-b p-1"> {h.content?.en} / {h.content?.ta} <button onClick={() => deleteHistory(h._id)} className="text-red-600">Delete</button> </li> ))} </ul> </div>
      {/* Gallery Section */}
      <div className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Gallery</h2>
        <input type="file" onChange={e => setGalleryFile(e.target.files[0])} className="mb-2" />
        <input placeholder="Title" value={newGallery.title} onChange={e => setNewGallery({ ...newGallery, title: e.target.value })} className="border p-2 mb-2 w-full" />
        <textarea placeholder="Description" value={newGallery.description} onChange={e => setNewGallery({ ...newGallery, description: e.target.value })} className="border p-2 mb-2 w-full" />
        <button onClick={uploadGallery} className="bg-blue-600 text-white px-3 py-1 rounded mb-2">Upload</button>
        <div className="grid grid-cols-3 gap-2">
          {gallery.map(g => (
            <div key={g._id} className="border p-1 relative">
              <img src={`http://localhost:5000${g.url}`} alt={g.title} className="w-full h-24 object-cover mb-1" />
              <p className="font-semibold">{g.title}</p>
              <p className="text-sm">{g.description}</p>
              <button onClick={() => deleteGallery(g._id)} className="absolute top-1 right-1 text-red-600">X</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
