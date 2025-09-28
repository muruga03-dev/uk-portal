// client/src/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("adminToken");
  const headers = { Authorization: `Bearer ${token}` };

  // ---------- State ----------
  const [families, setFamilies] = useState([]);
  const [events, setEvents] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [gallery, setGallery] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // family form
  const [newFamily, setNewFamily] = useState({
    familyId: "",
    leaderName: "",
    email: "",
    password: "",
    members: "",
    phone: "",
    address: "",
  });

  // tax form / selection
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [taxMonth, setTaxMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
  });
  const [taxAmount, setTaxAmount] = useState("");
  const [taxPaid, setTaxPaid] = useState(false);

  // gallery form
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryMeta, setGalleryMeta] = useState({ title: "", description: "" });

  // event/worker/history forms
  const [newEvent, setNewEvent] = useState({ title: "", date: "" });
  const [newWorker, setNewWorker] = useState({ type: "", description: "" });
  const [newHistory, setNewHistory] = useState({ contentEN: "", contentTA: "" });

  // UI helpers
  const [searchFamily, setSearchFamily] = useState("");

  // ---------- Load all data ----------
  const loadAll = async () => {
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
    } catch (err) {
      console.error("LoadAll error:", err);
      setErrorMsg("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return setErrorMsg("No admin token. Please login.");
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ---------- Family CRUD / approve ----------
  const createFamily = async () => {
    if (!newFamily.familyId || !newFamily.password || !newFamily.leaderName || !newFamily.email) {
      return alert("Family ID, Leader Name, Email, Password required");
    }
    try {
      setLoading(true);
      const body = {
        familyId: newFamily.familyId,
        leaderName: newFamily.leaderName,
        email: newFamily.email,
        password: newFamily.password,
        members: newFamily.members ? newFamily.members.split(",").map(s => s.trim()) : [],
        phone: newFamily.phone,
        address: newFamily.address,
      };
      await axios.post(`${API_BASE}/api/admin/families`, body, { headers });
      setNewFamily({ familyId: "", leaderName: "", email: "", password: "", members: "", phone: "", address: "" });
      await loadAll();
    } catch (err) {
      console.error("createFamily:", err.response || err);
      alert(err.response?.data?.message || "Failed to create family");
    } finally {
      setLoading(false);
    }
  };

  const approveFamily = async (id, approve = true) => {
    try {
      setLoading(true);
      const endpoint = approve ? "/families/approve" : "/families/reject";
      await axios.post(`${API_BASE}/api/admin${endpoint}`, { id }, { headers });
      await loadAll();
    } catch (err) {
      console.error("approveFamily:", err.response || err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Tax: selection helpers ----------
  const toggleSelectFamily = (id) => {
    setSelectedFamilies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedFamilies([]);
      setSelectAll(false);
    } else {
      setSelectedFamilies(families.map(f => f._id));
      setSelectAll(true);
    }
  };

  // ---------- Add tax (bulk) ----------
  const addTaxBulk = async () => {
    if (!taxMonth || !taxAmount) return alert("Month and amount required");
    if (!selectedFamilies.length) return alert("Please select at least one family");

    try {
      setLoading(true);
      // backend expects: { familyIds: [...], taxAmount, month, paid }
      await axios.post(`${API_BASE}/api/admin/families/tax/bulk`, {
        familyIds: selectedFamilies,
        taxAmount,
        month: taxMonth,
        paid: taxPaid || false,
      }, { headers });

      // reflect in UI without full reload: update local families list
      setFamilies(prev => prev.map(f => {
        if (selectedFamilies.includes(f._id)) {
          const taxHistory = f.taxHistory ? [...f.taxHistory] : [];
          taxHistory.push({ month: taxMonth, amount: taxAmount, paid: !!taxPaid, uploadedAt: new Date().toISOString() });
          return { ...f, taxHistory };
        }
        return f;
      }));

      // reset selectors
      setSelectedFamilies([]);
      setSelectAll(false);
      setTaxAmount("");
      setTaxPaid(false);
      alert("Tax added to selected families");
    } catch (err) {
      console.error("addTaxBulk:", err.response || err);
      alert(err.response?.data?.message || "Failed to add tax");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mark single family's tax as paid for selected month ----------
  // Backend: expects an endpoint to mark paid - we call PATCH /api/admin/families/:id/tax
  const markFamilyTaxPaid = async (familyId, month) => {
    try {
      setLoading(true);
      await axios.patch(`${API_BASE}/api/admin/families/${familyId}/tax`, { month, paid: true }, { headers });

      // Update local state immediately
      setFamilies(prev => prev.map(f => {
        if (f._id !== familyId) return f;
        const taxHistory = f.taxHistory ? f.taxHistory.map(t => t.month === month ? { ...t, paid: true } : t) : [{ month, amount: 0, paid: true }];
        return { ...f, taxHistory };
      }));
    } catch (err) {
      console.error("markFamilyTaxPaid:", err.response || err);
      alert(err.response?.data?.message || "Failed to mark paid");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Send notifications (calls API to send SMS/WhatsApp or email) ----------
  const sendNotifications = async () => {
    if (!window.confirm("Send notification to all families?")) return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/families/notify`, {}, { headers });
      alert("Notifications queued/sent (backend handles sending).");
    } catch (err) {
      console.error("sendNotifications:", err.response || err);
      alert("Failed to send notifications");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Events/Workers/History CRUD ----------
  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return alert("Title & date required");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/events`, newEvent, { headers });
      setNewEvent({ title: "", date: "" });
      await loadAll();
    } catch (err) {
      console.error("addEvent:", err.response || err);
    } finally { setLoading(false); }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Delete event?")) return;
    try { setLoading(true); await axios.delete(`${API_BASE}/api/admin/events/${id}`, { headers }); await loadAll(); }
    catch (err) { console.error("deleteEvent:", err.response || err); } finally { setLoading(false); }
  };

  const addWorker = async () => {
    if (!newWorker.type) return alert("Worker type required");
    try { setLoading(true); await axios.post(`${API_BASE}/api/admin/workers`, newWorker, { headers }); setNewWorker({ type: "", description: "" }); await loadAll(); }
    catch (err) { console.error("addWorker:", err.response || err); } finally { setLoading(false); }
  };
  const deleteWorker = async (id) => { if (!window.confirm("Delete worker?")) return; try { setLoading(true); await axios.delete(`${API_BASE}/api/admin/workers/${id}`, { headers }); await loadAll(); } catch (err) { console.error(err); } finally { setLoading(false); } };

  const addHistory = async () => {
    if (!newHistory.contentEN && !newHistory.contentTA) return alert("Enter history content");
    try { setLoading(true); await axios.post(`${API_BASE}/api/admin/history`, { content: { en: newHistory.contentEN, ta: newHistory.contentTA } }, { headers }); setNewHistory({ contentEN: "", contentTA: "" }); await loadAll(); }
    catch (err) { console.error("addHistory:", err.response || err); } finally { setLoading(false); }
  };
  const deleteHistory = async (id) => { if (!window.confirm("Delete history entry?")) return; try { setLoading(true); await axios.delete(`${API_BASE}/api/admin/history/${id}`, { headers }); await loadAll(); } catch (err) { console.error(err); } finally { setLoading(false); } };

  // ---------- Gallery upload/delete ----------
  const uploadGallery = async () => {
    if (!galleryFile) return alert("Select file");
    try {
      setLoading(true);
      const fd = new FormData();
      // IMPORTANT: backend multer config expects field name "image"
      fd.append("image", galleryFile);
      fd.append("title", galleryMeta.title || "Untitled");
      fd.append("description", galleryMeta.description || "");
      await axios.post(`${API_BASE}/api/admin/gallery/upload`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setGalleryFile(null);
      setGalleryMeta({ title: "", description: "" });
      await loadAll();
      alert("Uploaded");
    } catch (err) {
      console.error("uploadGallery:", err.response || err);
      alert("Failed to upload");
    } finally { setLoading(false); }
  };
  const deleteGallery = async (id) => {
    if (!window.confirm("Delete gallery item?")) return;
    try { setLoading(true); await axios.delete(`${API_BASE}/api/admin/gallery/${id}`, { headers }); await loadAll(); }
    catch (err) { console.error("deleteGallery:", err.response || err); } finally { setLoading(false); }
  };

  // ---------- Derived lists for the selected month ----------
  const familiesFiltered = useMemo(() => {
    if (!searchFamily) return families;
    const q = searchFamily.toLowerCase();
    return families.filter(f => (f.familyId + "|" + f.leaderName + "|" + (f.email||"")).toLowerCase().includes(q));
  }, [families, searchFamily]);

  const paidForSelectedMonth = useMemo(() => {
    return families.filter(f => f.taxHistory?.some(t => t.month === taxMonth && t.paid));
  }, [families, taxMonth]);

  const unpaidForSelectedMonth = useMemo(() => {
    return families.filter(f => {
      // if taxHistory contains month and not paid => unpaid
      const t = f.taxHistory?.find(x => x.month === taxMonth);
      return (t && !t.paid) || (!t); // treat missing entry as unpaid (so admin can add)
    });
  }, [families, taxMonth]);

  const totalPaidThisMonth = useMemo(() => {
    return paidForSelectedMonth.reduce((sum, f) => {
      const t = f.taxHistory?.find(x => x.month === taxMonth && x.paid);
      return sum + (t ? Number(t.amount || 0) : 0);
    }, 0);
  }, [paidForSelectedMonth, taxMonth]);

  // ---------- small helper to extract display amount ----------
  const displayTaxAmount = (f, month) => {
    const t = f.taxHistory?.find(x => x.month === month);
    return t ? t.amount : "-";
  };

  // ---------- Render ----------
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center mb-4">Admin Dashboard</h1>

      {errorMsg && <div className="text-red-600 text-center">{errorMsg}</div>}
      {loading && <div className="text-center text-blue-600">Processing...</div>}

      {/* ---------- Families Section ---------- */}
      <section className="p-4 border rounded space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Families</h2>
          <div className="flex gap-2">
            <input value={searchFamily} onChange={(e) => setSearchFamily(e.target.value)} placeholder="Search families..." className="border px-2 py-1 rounded" />
            <button onClick={loadAll} className="bg-gray-200 px-3 py-1 rounded">Refresh</button>
            <button onClick={sendNotifications} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">Send Notifications</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            {/* create family form */}
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold mb-2">Create Family</h3>
              <div className="grid gap-2 md:grid-cols-2">
                <input placeholder="Family ID" value={newFamily.familyId} onChange={(e) => setNewFamily({ ...newFamily, familyId: e.target.value })} className="border px-2 py-1 rounded" />
                <input placeholder="Leader name" value={newFamily.leaderName} onChange={(e) => setNewFamily({ ...newFamily, leaderName: e.target.value })} className="border px-2 py-1 rounded" />
                <input placeholder="Email" value={newFamily.email} onChange={(e) => setNewFamily({ ...newFamily, email: e.target.value })} className="border px-2 py-1 rounded" />
                <input placeholder="Password" value={newFamily.password} onChange={(e) => setNewFamily({ ...newFamily, password: e.target.value })} className="border px-2 py-1 rounded" />
                <input placeholder="Members (comma separated)" value={newFamily.members} onChange={(e) => setNewFamily({ ...newFamily, members: e.target.value })} className="border px-2 py-1 rounded md:col-span-2" />
                <input placeholder="Phone" value={newFamily.phone} onChange={(e) => setNewFamily({ ...newFamily, phone: e.target.value })} className="border px-2 py-1 rounded" />
                <input placeholder="Address" value={newFamily.address} onChange={(e) => setNewFamily({ ...newFamily, address: e.target.value })} className="border px-2 py-1 rounded" />
              </div>
              <div className="mt-2">
                <button onClick={createFamily} className="bg-green-600 text-white px-3 py-1 rounded">Create</button>
              </div>
            </div>

            {/* families table (scrollable) */}
            <div className="mt-3 h-72 overflow-auto border rounded p-2 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 border">Sel</th>
                    <th className="p-2 border">Family ID</th>
                    <th className="p-2 border">Leader</th>
                    <th className="p-2 border">Approved</th>
                    <th className="p-2 border">Latest Tax</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {familiesFiltered.map(f => {
                    const latest = f.taxHistory?.length ? f.taxHistory[f.taxHistory.length - 1] : null;
                    return (
                      <tr key={f._id} className="even:bg-gray-50">
                        <td className="p-2 border text-center">
                          <input type="checkbox" checked={selectedFamilies.includes(f._id)} onChange={() => toggleSelectFamily(f._id)} />
                        </td>
                        <td className="p-2 border">{f.familyId}</td>
                        <td className="p-2 border">{f.leaderName}</td>
                        <td className="p-2 border">{f.approved ? "Yes" : "No"}</td>
                        <td className="p-2 border">{latest ? `${latest.month} - ${latest.amount} (${latest.paid ? "Paid" : "Unpaid"})` : "No Tax"}</td>
                        <td className="p-2 border space-x-1">
                          <button onClick={() => approveFamily(f._id, true)} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Approve</button>
                          <button onClick={() => approveFamily(f._id, false)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Reject</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* right column: Tax management and cards */}
          <div>
            <div className="bg-white p-3 rounded shadow">
              <h3 className="font-semibold mb-2">Add Tax (Bulk)</h3>
              <div className="flex flex-col md:flex-row gap-2 items-center">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /> Select All
                </label>

                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Manual select (scroll families left column)</div>
                  <div className="flex gap-2 items-center">
                    <input type="month" value={taxMonth} onChange={(e) => setTaxMonth(e.target.value)} className="border px-2 py-1 rounded" />
                    <input placeholder="Amount" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} className="border px-2 py-1 rounded" />
                    <label className="flex items-center gap-1"><input type="checkbox" checked={taxPaid} onChange={(e) => setTaxPaid(e.target.checked)} /> Mark as Paid</label>
                    <button onClick={addTaxBulk} className="bg-green-600 text-white px-3 py-1 rounded">Add Tax</button>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Selected month: {taxMonth}</h4>
                  <div className="text-sm">Total paid this month: <strong>₹{totalPaidThisMonth}</strong></div>
                </div>
              </div>
            </div>

            {/* Paid / Unpaid cards for selected month */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-semibold mb-2">Paid Families ({paidForSelectedMonth.length})</h4>
                <div className="max-h-48 overflow-auto">
                  {paidForSelectedMonth.map(f => {
                    const t = f.taxHistory.find(x => x.month === taxMonth && x.paid);
                    return (
                      <div key={f._id} className="flex justify-between items-center py-1 border-b">
                        <div>
                          <div className="font-medium">{f.familyId} — {f.leaderName}</div>
                          <div className="text-sm text-gray-600">₹{t?.amount} • {t?.month}</div>
                        </div>
                        <div className="text-sm text-green-600">Paid</div>
                      </div>
                    );
                  })}
                  {paidForSelectedMonth.length === 0 && <div className="text-gray-500">No paid families for selected month.</div>}
                </div>
              </div>

              <div className="bg-white p-3 rounded shadow">
                <h4 className="font-semibold mb-2">Pending Families ({unpaidForSelectedMonth.length})</h4>
                <div className="max-h-48 overflow-auto">
                  {unpaidForSelectedMonth.map(f => {
                    const t = f.taxHistory?.find(x => x.month === taxMonth);
                    const amount = t ? t.amount : taxAmount || "-";
                    const paidFlag = t ? t.paid : false;
                    // Show only unpaid or missing entries
                    if (paidFlag) return null;
                    return (
                      <div key={f._id} className="flex justify-between items-center py-1 border-b">
                        <div>
                          <div className="font-medium">{f.familyId} — {f.leaderName}</div>
                          <div className="text-sm text-gray-600">Amount: ₹{amount} • {t ? t.month : taxMonth}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <button className="text-sm bg-blue-600 text-white px-2 py-1 rounded" onClick={() => markFamilyTaxPaid(f._id, taxMonth)}>Mark Paid</button>
                        </div>
                      </div>
                    );
                  })}
                  {unpaidForSelectedMonth.length === 0 && <div className="text-gray-500">No pending families for selected month.</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Events / Workers / History / Gallery ---------- */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Events</h3>
          <ul className="space-y-2">
            {events.map(ev => (
              <li key={ev._id} className="flex justify-between items-center">
                <div>{ev.title} • <span className="text-sm text-gray-500">{new Date(ev.date).toLocaleDateString()}</span></div>
                <button onClick={() => deleteEvent(ev._id)} className="text-red-600 underline">Delete</button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input placeholder="Title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="border px-2 py-1 rounded flex-1" />
            <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="border px-2 py-1 rounded" />
            <button onClick={addEvent} className="bg-green-600 text-white px-3 py-1 rounded">Add</button>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Workers</h3>
          <ul className="space-y-2">
            {workers.map(w => (
              <li key={w._id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{w.type}</div>
                  <div className="text-sm text-gray-600">{w.description}</div>
                </div>
                <button onClick={() => deleteWorker(w._id)} className="text-red-600 underline">Delete</button>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2">
            <input placeholder="Work type" value={newWorker.type} onChange={(e) => setNewWorker({ ...newWorker, type: e.target.value })} className="border px-2 py-1 rounded" />
            <input placeholder="Description" value={newWorker.description} onChange={(e) => setNewWorker({ ...newWorker, description: e.target.value })} className="border px-2 py-1 rounded" />
            <button onClick={addWorker} className="bg-green-600 text-white px-3 py-1 rounded">Add Worker</button>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">History</h3>
          <ul className="space-y-2">
            {historyItems.map(h => (
              <li key={h._id} className="flex justify-between items-center">
                <div>{h.content?.en || h.content?.ta}</div>
                <button onClick={() => deleteHistory(h._id)} className="text-red-600 underline">Delete</button>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2">
            <input placeholder="Content (EN)" value={newHistory.contentEN} onChange={(e) => setNewHistory({ ...newHistory, contentEN: e.target.value })} className="border px-2 py-1 rounded" />
            <input placeholder="Content (TA)" value={newHistory.contentTA} onChange={(e) => setNewHistory({ ...newHistory, contentTA: e.target.value })} className="border px-2 py-1 rounded" />
            <button onClick={addHistory} className="bg-green-600 text-white px-3 py-1 rounded">Add</button>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Gallery (Photos & Videos)</h3>
          <ul className="space-y-2">
            {gallery.map(g => (
              <li key={g._id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-sm text-gray-600">{g.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`${API_BASE}${g.url}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">View</a>
                  <button onClick={() => deleteGallery(g._id)} className="text-red-600 underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 grid gap-2">
            <input type="file" onChange={(e) => setGalleryFile(e.target.files[0])} className="border px-2 py-1 rounded" />
            <input placeholder="Title" value={galleryMeta.title} onChange={(e) => setGalleryMeta({ ...galleryMeta, title: e.target.value })} className="border px-2 py-1 rounded" />
            <input placeholder="Description" value={galleryMeta.description} onChange={(e) => setGalleryMeta({ ...galleryMeta, description: e.target.value })} className="border px-2 py-1 rounded" />
            <button onClick={uploadGallery} className="bg-green-600 text-white px-3 py-1 rounded">Upload</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
