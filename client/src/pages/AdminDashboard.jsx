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
  const [successMsg, setSuccessMsg] = useState("");
  
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  const [activeTab, setActiveTab] = useState("families");

  // Show success message
  const showSuccess = (message) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // ---------- Load all data ----------
  const loadAll = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      
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
      setErrorMsg("Failed to load admin data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setErrorMsg("No admin token. Please login.");
      return;
    }
    loadAll();
  }, [token]);

  // ---------- Family CRUD / approve ----------
  const createFamily = async () => {
    if (!newFamily.familyId || !newFamily.password || !newFamily.leaderName || !newFamily.email) {
      return setErrorMsg("Family ID, Leader Name, Email, and Password are required");
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
      
      setNewFamily({
        familyId: "",
        leaderName: "",
        email: "",
        password: "",
        members: "",
        phone: "",
        address: "",
      });
      
      await loadAll();
      showSuccess("Family created successfully!");
    } catch (err) {
      console.error("createFamily:", err.response || err);
      setErrorMsg(err.response?.data?.message || "Failed to create family");
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
      showSuccess(`Family ${approve ? "approved" : "rejected"} successfully!`);
    } catch (err) {
      console.error("approveFamily:", err.response || err);
      setErrorMsg("Failed to update family status");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Tax: selection helpers ----------
  const toggleSelectFamily = (id) => {
    setSelectedFamilies(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
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
    if (!taxMonth || !taxAmount) return setErrorMsg("Month and amount are required");
    if (!selectedFamilies.length) return setErrorMsg("Please select at least one family");

    try {
      setLoading(true);
      
      await axios.post(
        `${API_BASE}/api/admin/families/tax/bulk`,
        {
          familyIds: selectedFamilies,
          taxAmount: parseFloat(taxAmount),
          month: taxMonth,
          paid: taxPaid || false,
        },
        { headers }
      );

      // Update local state
      setFamilies(prev => prev.map(f => {
        if (selectedFamilies.includes(f._id)) {
          const taxHistory = f.taxHistory ? [...f.taxHistory] : [];
          taxHistory.push({
            month: taxMonth,
            amount: parseFloat(taxAmount),
            paid: !!taxPaid,
            uploadedAt: new Date().toISOString()
          });
          return { ...f, taxHistory };
        }
        return f;
      }));

      // Reset form
      setSelectedFamilies([]);
      setSelectAll(false);
      setTaxAmount("");
      setTaxPaid(false);
      
      showSuccess("Tax added to selected families successfully!");
    } catch (err) {
      console.error("addTaxBulk:", err.response || err);
      setErrorMsg(err.response?.data?.message || "Failed to add tax");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Mark single family's tax as paid ----------
  const markFamilyTaxPaid = async (familyId, month) => {
    try {
      setLoading(true);
      await axios.patch(
        `${API_BASE}/api/admin/families/${familyId}/tax`,
        { month, paid: true },
        { headers }
      );

      // Update local state
      setFamilies(prev => prev.map(f => {
        if (f._id !== familyId) return f;
        
        const taxHistory = f.taxHistory ? f.taxHistory.map(t => 
          t.month === month ? { ...t, paid: true } : t
        ) : [];
        
        return { ...f, taxHistory };
      }));
      
      showSuccess("Tax marked as paid successfully!");
    } catch (err) {
      console.error("markFamilyTaxPaid:", err.response || err);
      setErrorMsg(err.response?.data?.message || "Failed to mark tax as paid");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Delete tax record ----------
  const deleteTaxRecord = async (familyId, taxId) => {
    if (!window.confirm("Are you sure you want to delete this tax record?")) return;

    try {
      setLoading(true);
      await axios.delete(
        `${API_BASE}/api/admin/families/${familyId}/tax/${taxId}`,
        { headers }
      );

      // Update local state
      setFamilies(prev => prev.map(f => {
        if (f._id !== familyId) return f;
        const taxHistory = f.taxHistory.filter(t => t._id !== taxId);
        return { ...f, taxHistory };
      }));

      showSuccess("Tax record deleted successfully!");
    } catch (err) {
      console.error("deleteTaxRecord:", err.response || err);
      setErrorMsg(err.response?.data?.message || "Failed to delete tax record");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Send notifications ----------
  const sendNotifications = async () => {
    if (!window.confirm("Send notification to all families with pending taxes?")) return;

    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/families/notify`, {}, { headers });
      showSuccess("Notifications sent successfully!");
    } catch (err) {
      console.error("sendNotifications:", err.response || err);
      setErrorMsg("Failed to send notifications");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Events CRUD ----------
  const addEvent = async () => {
    if (!newEvent.title || !newEvent.date) return setErrorMsg("Title & date are required");
    
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/events`, newEvent, { headers });
      setNewEvent({ title: "", date: "" });
      await loadAll();
      showSuccess("Event added successfully!");
    } catch (err) {
      console.error("addEvent:", err.response || err);
      setErrorMsg("Failed to add event");
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/admin/events/${id}`, { headers });
      await loadAll();
      showSuccess("Event deleted successfully!");
    } catch (err) {
      console.error("deleteEvent:", err.response || err);
      setErrorMsg("Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Workers CRUD ----------
  const addWorker = async () => {
    if (!newWorker.type) return setErrorMsg("Worker type is required");
    
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/admin/workers`, newWorker, { headers });
      setNewWorker({ type: "", description: "" });
      await loadAll();
      showSuccess("Worker added successfully!");
    } catch (err) {
      console.error("addWorker:", err.response || err);
      setErrorMsg("Failed to add worker");
    } finally {
      setLoading(false);
    }
  };

  const deleteWorker = async (id) => {
    if (!window.confirm("Are you sure you want to delete this worker?")) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/admin/workers/${id}`, { headers });
      await loadAll();
      showSuccess("Worker deleted successfully!");
    } catch (err) {
      console.error("deleteWorker:", err);
      setErrorMsg("Failed to delete worker");
    } finally {
      setLoading(false);
    }
  };

  // ---------- History CRUD ----------
  const addHistory = async () => {
    if (!newHistory.contentEN && !newHistory.contentTA) return setErrorMsg("Enter history content in at least one language");
    
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/api/admin/history`,
        { content: { en: newHistory.contentEN, ta: newHistory.contentTA } },
        { headers }
      );
      setNewHistory({ contentEN: "", contentTA: "" });
      await loadAll();
      showSuccess("History entry added successfully!");
    } catch (err) {
      console.error("addHistory:", err.response || err);
      setErrorMsg("Failed to add history entry");
    } finally {
      setLoading(false);
    }
  };

  const deleteHistory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this history entry?")) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/admin/history/${id}`, { headers });
      await loadAll();
      showSuccess("History entry deleted successfully!");
    } catch (err) {
      console.error("deleteHistory:", err);
      setErrorMsg("Failed to delete history entry");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Gallery upload/delete ----------
  const uploadGallery = async () => {
    if (!galleryFile) return setErrorMsg("Please select a file");
    
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("image", galleryFile);
      fd.append("title", galleryMeta.title || "Untitled");
      fd.append("description", galleryMeta.description || "");

      await axios.post(`${API_BASE}/api/admin/gallery/upload`, fd, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });

      setGalleryFile(null);
      setGalleryMeta({ title: "", description: "" });
      await loadAll();
      showSuccess("File uploaded successfully!");
    } catch (err) {
      console.error("uploadGallery:", err.response || err);
      setErrorMsg("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const deleteGallery = async (id) => {
    if (!window.confirm("Are you sure you want to delete this gallery item?")) return;
    
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/admin/gallery/${id}`, { headers });
      await loadAll();
      showSuccess("Gallery item deleted successfully!");
    } catch (err) {
      console.error("deleteGallery:", err.response || err);
      setErrorMsg("Failed to delete gallery item");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Derived data for tax management ----------
  const familiesFiltered = useMemo(() => {
    if (!searchFamily) return families;
    const q = searchFamily.toLowerCase();
    return families.filter(f => 
      (f.familyId + "|" + f.leaderName + "|" + (f.email || "")).toLowerCase().includes(q)
    );
  }, [families, searchFamily]);

  const paidForSelectedMonth = useMemo(() => {
    return families.filter(f => 
      f.taxHistory?.some(t => t.month === taxMonth && t.paid)
    );
  }, [families, taxMonth]);

  const unpaidForSelectedMonth = useMemo(() => {
    return families.filter(f => {
      const t = f.taxHistory?.find(x => x.month === taxMonth);
      return (t && !t.paid) || !t;
    });
  }, [families, taxMonth]);

  const totalPaidThisMonth = useMemo(() => {
    return paidForSelectedMonth.reduce((sum, f) => {
      const t = f.taxHistory?.find(x => x.month === taxMonth && x.paid);
      return sum + (t ? Number(t.amount || 0) : 0);
    }, 0);
  }, [paidForSelectedMonth, taxMonth]);

  // ---------- Navigation Tabs ----------
  const NavigationTabs = () => (
    <div className="flex overflow-x-auto border-b mb-6 bg-white rounded-lg shadow-sm">
      {[
        { id: "families", label: "Families", icon: "👨‍👩‍👧‍👦" },
        { id: "events", label: "Events", icon: "📅" },
        { id: "workers", label: "Workers", icon: "👷" },
        { id: "history", label: "History", icon: "📚" },
        { id: "gallery", label: "Gallery", icon: "🖼️" }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 min-w-32 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  // ---------- Render Components ----------
  const FamiliesSection = () => (
    <section className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <h2 className="text-xl font-bold text-gray-800">Family Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <input
            value={searchFamily}
            onChange={(e) => setSearchFamily(e.target.value)}
            placeholder="Search families..."
            className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
          <div className="flex gap-2">
            <button
              onClick={loadAll}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Refresh
            </button>
            <button
              onClick={sendNotifications}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Send Notifications
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create Family Form */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg mb-3 text-gray-800">Create New Family</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              placeholder="Family ID *"
              value={newFamily.familyId}
              onChange={(e) => setNewFamily({ ...newFamily, familyId: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Leader name *"
              value={newFamily.leaderName}
              onChange={(e) => setNewFamily({ ...newFamily, leaderName: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Email *"
              type="email"
              value={newFamily.email}
              onChange={(e) => setNewFamily({ ...newFamily, email: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Password *"
              type="password"
              value={newFamily.password}
              onChange={(e) => setNewFamily({ ...newFamily, password: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Members (comma separated)"
              value={newFamily.members}
              onChange={(e) => setNewFamily({ ...newFamily, members: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded md:col-span-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Phone"
              value={newFamily.phone}
              onChange={(e) => setNewFamily({ ...newFamily, phone: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="Address"
              value={newFamily.address}
              onChange={(e) => setNewFamily({ ...newFamily, address: e.target.value })}
              className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-4">
            <button
              onClick={createFamily}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-medium w-full"
            >
              Create Family
            </button>
          </div>
        </div>

        {/* Tax Management */}
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-lg mb-3 text-gray-800">Tax Management</h3>
          
          {/* Bulk Tax Form */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium">Select All Families</label>
            </div>
            
            <div className="grid gap-2">
              <div className="text-xs text-gray-500">Selected: {selectedFamilies.length} families</div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="month"
                  value={taxMonth}
                  onChange={(e) => setTaxMonth(e.target.value)}
                  className="border border-gray-300 px-3 py-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Amount"
                  type="number"
                  value={taxAmount}
                  onChange={(e) => setTaxAmount(e.target.value)}
                  className="border border-gray-300 px-3 py-2 rounded w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={taxPaid}
                  onChange={(e) => setTaxPaid(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm">Mark as Paid</label>
              </div>
              <button
                onClick={addTaxBulk}
                disabled={!selectedFamilies.length}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors font-medium"
              >
                Add Tax to Selected
              </button>
            </div>
          </div>

          {/* Tax Summary */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">Month: {taxMonth}</h4>
              <div className="text-sm font-medium">
                Total Paid: <span className="text-green-600">₹{totalPaidThisMonth}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Families Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700">Select</th>
                <th className="p-3 text-left font-medium text-gray-700">Family ID</th>
                <th className="p-3 text-left font-medium text-gray-700">Leader</th>
                <th className="p-3 text-left font-medium text-gray-700">Status</th>
                <th className="p-3 text-left font-medium text-gray-700">Latest Tax</th>
                <th className="p-3 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {familiesFiltered.map(f => {
                const latest = f.taxHistory?.length ? f.taxHistory[f.taxHistory.length - 1] : null;
                return (
                  <tr key={f._id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedFamilies.includes(f._id)}
                        onChange={() => toggleSelectFamily(f._id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-3 font-medium text-gray-900">{f.familyId}</td>
                    <td className="p-3 text-gray-700">{f.leaderName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        f.approved 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {f.approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">
                      {latest ? (
                        <div>
                          <div>{latest.month} - ₹{latest.amount}</div>
                          <span className={`text-xs ${
                            latest.paid ? "text-green-600" : "text-red-600"
                          }`}>
                            {latest.paid ? "Paid" : "Unpaid"}
                          </span>
                        </div>
                      ) : "No Tax"}
                    </td>
                    <td className="p-3 space-x-2">
                      {!f.approved && (
                        <>
                          <button
                            onClick={() => approveFamily(f._id, true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => approveFamily(f._id, false)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {familiesFiltered.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No families found
          </div>
        )}
      </div>

      {/* Tax Status Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
            <span>Paid Families</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
              {paidForSelectedMonth.length}
            </span>
          </h4>
          <div className="max-h-48 overflow-auto space-y-2">
            {paidForSelectedMonth.map(f => {
              const t = f.taxHistory.find(x => x.month === taxMonth && x.paid);
              return (
                <div key={f._id} className="flex justify-between items-center p-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{f.familyId} — {f.leaderName}</div>
                    <div className="text-sm text-gray-600">₹{t?.amount} • {t?.month}</div>
                  </div>
                  <span className="text-green-600 text-sm font-medium">Paid</span>
                </div>
              );
            })}
            {paidForSelectedMonth.length === 0 && (
              <div className="text-center text-gray-500 py-4">No paid families for selected month</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <span>Pending Families</span>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
              {unpaidForSelectedMonth.length}
            </span>
          </h4>
          <div className="max-h-48 overflow-auto space-y-2">
            {unpaidForSelectedMonth.map(f => {
              const t = f.taxHistory?.find(x => x.month === taxMonth);
              const amount = t ? t.amount : taxAmount || "-";
              
              if (t?.paid) return null;
              
              return (
                <div key={f._id} className="flex justify-between items-center p-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{f.familyId} — {f.leaderName}</div>
                    <div className="text-sm text-gray-600">Amount: ₹{amount} • {t ? t.month : taxMonth}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => markFamilyTaxPaid(f._id, taxMonth)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Mark Paid
                    </button>
                    {t && (
                      <button
                        onClick={() => deleteTaxRecord(f._id, t._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {unpaidForSelectedMonth.length === 0 && (
              <div className="text-center text-gray-500 py-4">No pending families for selected month</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  const EventsSection = () => (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Event Management</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-lg mb-3">Add New Event</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            placeholder="Event Title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addEvent}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors font-medium"
          >
            Add Event
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Current Events</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {events.map(ev => (
            <div key={ev._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <div className="font-medium text-gray-900">{ev.title}</div>
                <div className="text-sm text-gray-600">
                  {new Date(ev.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <button
                onClick={() => deleteEvent(ev._id)}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Delete
              </button>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No events scheduled
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const WorkersSection = () => (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Worker Management</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-lg mb-3">Add New Worker</h3>
        <div className="space-y-3">
          <input
            placeholder="Worker Type (e.g., Electrician, Plumber)"
            value={newWorker.type}
            onChange={(e) => setNewWorker({ ...newWorker, type: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Description"
            value={newWorker.description}
            onChange={(e) => setNewWorker({ ...newWorker, description: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addWorker}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors font-medium"
          >
            Add Worker
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Available Workers</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {workers.map(w => (
            <div key={w._id} className="p-4 flex justify-between items-start hover:bg-gray-50">
              <div>
                <div className="font-medium text-gray-900">{w.type}</div>
                <div className="text-sm text-gray-600 mt-1">{w.description}</div>
              </div>
              <button
                onClick={() => deleteWorker(w._id)}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                Delete
              </button>
            </div>
          ))}
          {workers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No workers available
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const HistorySection = () => (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">History Management</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-lg mb-3">Add History Entry</h3>
        <div className="space-y-3">
          <input
            placeholder="Content (English)"
            value={newHistory.contentEN}
            onChange={(e) => setNewHistory({ ...newHistory, contentEN: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Content (Tamil)"
            value={newHistory.contentTA}
            onChange={(e) => setNewHistory({ ...newHistory, contentTA: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addHistory}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors font-medium"
          >
            Add History
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">History Entries</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {historyItems.map(h => (
            <div key={h._id} className="p-4 flex justify-between items-start hover:bg-gray-50">
              <div className="flex-1">
                {h.content?.en && (
                  <div className="mb-2">
                    <div className="text-sm text-gray-500 font-medium">English:</div>
                    <div className="text-gray-900">{h.content.en}</div>
                  </div>
                )}
                {h.content?.ta && (
                  <div>
                    <div className="text-sm text-gray-500 font-medium">Tamil:</div>
                    <div className="text-gray-900">{h.content.ta}</div>
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteHistory(h._id)}
                className="text-red-600 hover:text-red-800 font-medium text-sm ml-4"
              >
                Delete
              </button>
            </div>
          ))}
          {historyItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No history entries
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const GallerySection = () => (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Gallery Management</h2>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-semibold text-lg mb-3">Upload New File</h3>
        <div className="space-y-3">
          <input
            type="file"
            onChange={(e) => setGalleryFile(e.target.files[0])}
            className="border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Title"
            value={galleryMeta.title}
            onChange={(e) => setGalleryMeta({ ...galleryMeta, title: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            placeholder="Description"
            value={galleryMeta.description}
            onChange={(e) => setGalleryMeta({ ...galleryMeta, description: e.target.value })}
            className="border border-gray-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={uploadGallery}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors font-medium"
          >
            Upload File
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Gallery Items</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {gallery.map(g => (
            <div key={g._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <div className="font-medium text-gray-900">{g.title}</div>
                <div className="text-sm text-gray-600">{g.description}</div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`${API_BASE}${g.url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  View
                </a>
                <button
                  onClick={() => deleteGallery(g._id)}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {gallery.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No gallery items
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // ---------- Main Render ----------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage families, taxes, events, and more</p>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
              Processing...
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mb-6 text-red-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-6 text-green-700">
            {successMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <NavigationTabs />

        {/* Content Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          {activeTab === "families" && <FamiliesSection />}
          {activeTab === "events" && <EventsSection />}
          {activeTab === "workers" && <WorkersSection />}
          {activeTab === "history" && <HistorySection />}
          {activeTab === "gallery" && <GallerySection />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;