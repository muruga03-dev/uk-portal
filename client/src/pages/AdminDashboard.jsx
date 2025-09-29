// src/components/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  // Core states
  const [families, setFamilies] = useState([]);
  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [gallery, setGallery] = useState([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form states
  const [newFamily, setNewFamily] = useState({
    familyId: "",
    leaderName: "",
    email: "",
    password: "",
    members: "",
    phone: "",
    address: "",
  });
  const [newEvent, setNewEvent] = useState({ title: "", date: "" });
  const [newWorker, setNewWorker] = useState({ type: "", description: "" });
  const [newHistory, setNewHistory] = useState({ contentEN: "", contentTA: "" });
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryMeta, setGalleryMeta] = useState({ title: "", description: "" });

  // Tax states
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [taxMonth, setTaxMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [taxAmount, setTaxAmount] = useState("");
  const [taxPaid, setTaxPaid] = useState(false);

  // Search
  const [searchFamily, setSearchFamily] = useState("");

  // Load all data
  const loadAll = async () => {
    if (!token) {
      setErrorMsg("Please log in to access the dashboard.");
      return;
    }
    try {
      setLoading(true);
      const [fRes, eRes, wRes, hRes, gRes] = await Promise.all([
        axios.get(`${API_BASE}/api/admin/families`, { headers }),
        axios.get(`${API_BASE}/api/admin/events`, { headers }),
        axios.get(`${API_BASE}/api/admin/workers`, { headers }),
        axios.get(`${API_BASE}/api/admin/history`, { headers }),
        axios.get(`${API_BASE}/api/admin/gallery`, { headers }),
      ]);
      setFamilies(fRes.data || []);
      setEvents(eRes.data || []);
      setWorkers(wRes.data || []);
      setHistoryItems(hRes.data || []);
      setGallery(gRes.data || []);
      setErrorMsg("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Action Handlers
  const createFamily = async () => {
    if (!newFamily.familyId || !newFamily.password || !newFamily.email || !newFamily.leaderName) {
      alert("Please fill required family details.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/api/admin/families`,
        {
          familyId: newFamily.familyId,
          leaderName: newFamily.leaderName,
          email: newFamily.email,
          password: newFamily.password,
          members: newFamily.members ? newFamily.members.split(",").map((m) => m.trim()) : [],
          phone: newFamily.phone,
          address: newFamily.address,
        },
        { headers }
      );
      setNewFamily({ familyId: "", leaderName: "", email: "", password: "", members: "", phone: "", address: "" });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create family.");
    } finally {
      setLoading(false);
    }
  };

  const approveFamily = async (id, approve) => {
    try {
      const confirmAction = window.confirm(`Are you sure you want to ${approve ? "approve" : "reject"} this family?`);
      if (!confirmAction) return;
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/${approve ? "families/approve" : "families/reject"}`, { id }, { headers });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to update family status.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFamilySelection = (id) => {
    setSelectedFamilies((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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

  // Bulk add tax - uses backend endpoint: POST /api/admin/families/tax
  const addTaxBulk = async () => {
    if (!taxMonth || !taxAmount || !selectedFamilies.length) {
      alert("Please fill all tax details and select families.");
      return;
    }
    try {
      setLoading(true);
      // payload: { familyIds, month, amount, paid } - matches backend
      await axios.post(`${API_BASE}/api/admin/families/tax`, {
        familyIds: selectedFamilies,
        month: taxMonth,
        amount: Number(taxAmount),
        paid: Boolean(taxPaid),
      }, { headers });

      // reset selection and fields
      setSelectedFamilies([]);
      setSelectAll(false);
      setTaxAmount("");
      setTaxPaid(false);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to add tax.");
    } finally {
      setLoading(false);
    }
  };

  // Mark tax paid for a single family: PATCH /api/admin/families/:familyId/tax { month, paid, amount? }
  const markTaxPaid = async (familyId, month) => {
    try {
      setLoading(true);
      await axios.patch(`${API_BASE}/api/admin/families/${familyId}/tax`, { month, paid: true }, { headers });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to update tax status.");
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return alert("Please fill in event title and date.");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/events`, newEvent, { headers });
      setNewEvent({ title: "", date: "" });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to add event.");
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Are you sure to delete this event?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/admin/events/${id}`, { headers });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete event.");
    } finally {
      setLoading(false);
    }
  };

  const addWorker = async () => {
    if (!newWorker.type) return alert("Please provide worker type.");
    try {
      setLoading(true);
      // Backend expects { type, description }
      await axios.post(`${API_BASE}/api/admin/workers`, newWorker, { headers });
      setNewWorker({ type: "", description: "" });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to add worker.");
    } finally {
      setLoading(false);
    }
  };

  const deleteWorker = async (id) => {
    if (!window.confirm("Are you sure to delete this worker?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/admin/workers/${id}`, { headers });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete worker.");
    } finally {
      setLoading(false);
    }
  };

  const addHistory = async () => {
    if (!newHistory.contentEN && !newHistory.contentTA) {
      alert("Please enter history content in at least one language.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/history`, {
        content: { en: newHistory.contentEN, ta: newHistory.contentTA },
      }, { headers });
      setNewHistory({ contentEN: "", contentTA: "" });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to add history.");
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (id) => {
    if (!window.confirm("Are you sure to delete this history entry?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/admin/history/${id}`, { headers });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete history.");
    } finally {
      setLoading(false);
    }
  };

  const uploadGallery = async () => {
    if (!galleryFile) {
      alert("Please select a file to upload.");
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("image", galleryFile);
      fd.append("title", galleryMeta.title || "Untitled");
      fd.append("description", galleryMeta.description || "");
      await axios.post(`${API_BASE}/api/admin/gallery`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setGalleryFile(null);
      setGalleryMeta({ title: "", description: "" });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to upload gallery item.");
    } finally {
      setLoading(false);
    }
  };

  const deleteGallery = async (id) => {
    if (!window.confirm("Are you sure to delete this gallery item?")) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/admin/gallery/${id}`, { headers });
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Failed to delete gallery.");
    } finally {
      setLoading(false);
    }
  };

  // Filtering & derived data
  const filteredFamilies = useMemo(() => {
    if (!searchFamily.trim()) return families;
    const lower = searchFamily.toLowerCase();
    return families.filter((f) => (f.familyId + " " + f.leaderName + " " + (f.email ?? "")).toLowerCase().includes(lower));
  }, [families, searchFamily]);

  const paidFamilies = useMemo(() => families.filter((f) => f.taxHistory?.some((t) => t.month === taxMonth && t.paid)), [families, taxMonth]);
  const unpaidFamilies = useMemo(() => families.filter((f) => !f.taxHistory?.some((t) => t.month === taxMonth && t.paid)), [families, taxMonth]);
  const totalPaid = useMemo(() => paidFamilies.reduce((acc, f) => {
    const entry = f.taxHistory.find((t) => t.month === taxMonth && t.paid);
    return acc + (Number(entry?.amount) || 0);
  }, 0), [paidFamilies, taxMonth]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded bg-slate-200" onClick={loadAll} disabled={loading}>Refresh</button>
          <button className="px-4 py-2 rounded bg-yellow-400" onClick={() => { if (window.confirm('Send notifications to all families?')) alert('Notifications queued') }}>Notify</button>
        </div>
      </header>

      {errorMsg && <div className="rounded bg-red-50 text-red-800 p-3">{errorMsg}</div>}
      {loading && <div className="rounded bg-blue-50 text-blue-800 p-3">Loading...</div>}

      {/* Families + Add Family column */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded shadow p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
            <input type="search" placeholder="Search families..." value={searchFamily} onChange={(e) => setSearchFamily(e.target.value)} className="w-full sm:w-64 p-2 border rounded" />
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                Select all
              </label>
              <span className="text-sm text-gray-600">Selected: {selectedFamilies.length}</span>
            </div>
          </div>

          <div className="overflow-auto max-h-[36rem] border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="p-2 text-center w-12"><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
                  <th className="p-2 text-left">Family ID</th>
                  <th className="p-2">Leader</th>
                  <th className="p-2 text-center">Approved</th>
                  <th className="p-2">Latest Tax</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFamilies.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-gray-600">No families found.</td></tr>
                )}
                {filteredFamilies.map((f) => {
                  const lastTax = f.taxHistory?.slice(-1)[0];
                  return (
                    <tr key={f._id} className="hover:bg-gray-50">
                      <td className="p-2 text-center"><input type="checkbox" checked={selectedFamilies.includes(f._id)} onChange={() => toggleFamilySelection(f._id)} /></td>
                      <td className="p-2">{f.familyId}</td>
                      <td className="p-2">{f.leaderName}</td>
                      <td className="p-2 text-center">{f.approved ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}</td>
                      <td className="p-2">{lastTax ? `${lastTax.month}: ₹${lastTax.amount} (${lastTax.paid ? "Paid" : "Pending"})` : "-"}</td>
                      <td className="p-2 text-center space-x-2">
                        <button onClick={() => approveFamily(f._id, true)} className="px-2 py-1 text-white bg-green-600 rounded text-xs">Approve</button>
                        <button onClick={() => approveFamily(f._id, false)} className="px-2 py-1 text-white bg-red-600 rounded text-xs">Reject</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Family panel */}
        <aside className="bg-white rounded shadow p-4 sticky top-4">
          <h2 className="text-lg font-semibold mb-3">Add New Family</h2>
          <div className="space-y-2">
            <input className="w-full p-2 border rounded" placeholder="Family ID" value={newFamily.familyId} onChange={(e) => setNewFamily({ ...newFamily, familyId: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Leader Name" value={newFamily.leaderName} onChange={(e) => setNewFamily({ ...newFamily, leaderName: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Email" type="email" value={newFamily.email} onChange={(e) => setNewFamily({ ...newFamily, email: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Password" type="password" value={newFamily.password} onChange={(e) => setNewFamily({ ...newFamily, password: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Members (comma-separated)" value={newFamily.members} onChange={(e) => setNewFamily({ ...newFamily, members: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Phone" value={newFamily.phone} onChange={(e) => setNewFamily({ ...newFamily, phone: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Address" value={newFamily.address} onChange={(e) => setNewFamily({ ...newFamily, address: e.target.value })} />
            <button className="w-full py-2 rounded bg-blue-600 text-white" onClick={createFamily} disabled={loading}>Create Family</button>
          </div>
        </aside>
      </section>

      {/* Tax Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-3">Add Bulk Tax</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              <span className="text-sm">Select All Families</span>
            </label>
            <input type="month" className="w-full p-2 border rounded" value={taxMonth} onChange={(e) => setTaxMonth(e.target.value)} />
            <input type="number" className="w-full p-2 border rounded" placeholder="Amount (₹)" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={taxPaid} onChange={(e) => setTaxPaid(e.target.checked)} />
              <span className="text-sm">Mark As Paid</span>
            </label>
            <button className="w-full py-2 rounded bg-green-600 text-white" onClick={addTaxBulk} disabled={loading}>Add Tax to Selected</button>
            <p className="text-center font-semibold mt-3">Total Paid this month: <span className="text-indigo-700">₹{totalPaid}</span></p>
          </div>
        </article>

        <article className="bg-white rounded shadow p-4 max-h-[300px] overflow-auto">
          <h3 className="font-semibold mb-3">Paid Families</h3>
          {!paidFamilies.length && <p>No paid families.</p>}
          {paidFamilies.map((f) => (
            <div key={f._id} className="p-2 rounded mb-2 bg-green-50 flex justify-between items-center">
              <div>
                <div className="font-medium">{f.familyId} — {f.leaderName}</div>
                <div className="text-sm text-gray-600">{f.taxHistory.find(t => t.month === taxMonth && t.paid)?.amount ? `₹${f.taxHistory.find(t => t.month === taxMonth && t.paid)?.amount}` : ""}</div>
              </div>
            </div>
          ))}
        </article>

        <article className="bg-white rounded shadow p-4 max-h-[300px] overflow-auto">
          <h3 className="font-semibold mb-3">Pending Families</h3>
          {!unpaidFamilies.length && <p>No pending families.</p>}
          {unpaidFamilies.map((f) => {
            const entry = f.taxHistory.find(t => t.month === taxMonth);
            const amount = entry?.amount || taxAmount || "-";
            return (
              <div key={f._id} className="p-2 rounded mb-2 bg-red-50 flex justify-between items-center">
                <div className="text-sm">{f.familyId} — {f.leaderName} • ₹{amount}</div>
                <button className="px-2 py-1 rounded bg-blue-600 text-white text-sm" onClick={() => markTaxPaid(f._id, taxMonth)} disabled={loading}>Mark Paid</button>
              </div>
            );
          })}
        </article>
      </section>

      {/* Events & Workers */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-3">Events</h3>
          <ul className="divide-y overflow-auto max-h-48">
            {!events.length && <li className="p-3 text-sm text-gray-600">No events found.</li>}
            {events.map(ev => (
              <li key={ev._id} className="flex justify-between items-center py-2">
                <div>{ev.title} • <span className="text-sm text-gray-600">{new Date(ev.date).toLocaleDateString()}</span></div>
                <button className="px-2 py-1 rounded bg-red-600 text-white text-xs" onClick={() => deleteEvent(ev._id)}>Delete</button>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <input className="p-2 border rounded" placeholder="Title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
            <input className="p-2 border rounded" type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} />
            <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={addEvent}>Add Event</button>
          </div>
        </article>

        <article className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-3">Workers</h3>
          <ul className="divide-y overflow-auto max-h-48">
            {!workers.length && <li className="p-3 text-sm text-gray-600">No workers found.</li>}
            {workers.map(w => (
              <li key={w._id} className="flex justify-between items-center py-2">
                <div>{w.type} — <span className="text-sm text-gray-600">{w.description}</span></div>
                <button className="px-2 py-1 rounded bg-red-600 text-white text-xs" onClick={() => deleteWorker(w._id)}>Delete</button>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2">
            <input className="p-2 border rounded" placeholder="Type" value={newWorker.type} onChange={e => setNewWorker({ ...newWorker, type: e.target.value })} />
            <input className="p-2 border rounded" placeholder="Description" value={newWorker.description} onChange={e => setNewWorker({ ...newWorker, description: e.target.value })} />
            <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={addWorker}>Add Worker</button>
          </div>
        </article>
      </section>

      {/* History & Gallery */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <article className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-3">History</h3>
          <ul className="divide-y overflow-auto max-h-48">
            {!historyItems.length && <li className="p-3 text-sm text-gray-600">No history records.</li>}
            {historyItems.map(item => (
              <li key={item._id} className="flex justify-between items-start py-2">
                <div className="text-sm">{item.content?.en || item.content?.ta}</div>
                <button className="px-2 py-1 rounded bg-red-600 text-white text-xs" onClick={() => deleteHistory(item._id)}>Delete</button>
              </li>
            ))}
          </ul>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <input className="p-2 border rounded" placeholder="Content English" value={newHistory.contentEN} onChange={e => setNewHistory({ ...newHistory, contentEN: e.target.value })} />
            <input className="p-2 border rounded" placeholder="Content Other" value={newHistory.contentTA} onChange={e => setNewHistory({ ...newHistory, contentTA: e.target.value })} />
            <button className="px-3 py-2 rounded bg-green-600 text-white" onClick={addHistory}>Add History</button>
          </div>
        </article>

        <article className="bg-white rounded shadow p-4">
          <h3 className="font-semibold mb-3">Gallery</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {!gallery.length && <div className="text-sm text-gray-600">No gallery items.</div>}
            {gallery.map(item => (
              <div key={item._id} className="p-2 border rounded flex flex-col">
                <a href={`${API_BASE}${item.url}`} target="_blank" rel="noreferrer" className="truncate underline text-blue-600">{item.title || "Untitled"}</a>
                <div className="text-xs text-gray-600 truncate mb-2">{item.description || ""}</div>
                <div className="mt-auto flex justify-end">
                  <button className="px-2 py-1 rounded bg-red-600 text-white text-xs" onClick={() => deleteGallery(item._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <input type="file" onChange={e => setGalleryFile(e.target.files[0])} />
            <input className="p-2 border rounded" placeholder="Title" value={galleryMeta.title} onChange={e => setGalleryMeta({ ...galleryMeta, title: e.target.value })} />
            <input className="p-2 border rounded" placeholder="Description" value={galleryMeta.description} onChange={e => setGalleryMeta({ ...galleryMeta, description: e.target.value })} />
            <button className="col-span-full px-3 py-2 rounded bg-green-600 text-white" onClick={uploadGallery} disabled={!galleryFile}>Upload</button>
          </div>
        </article>
      </section>
    </div>
  );
};

export default AdminDashboard;
