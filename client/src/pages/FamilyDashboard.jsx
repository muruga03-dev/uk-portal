import React, { useEffect, useState } from "react";

// Reusable label-value component
const InfoItem = ({ label, value }) => (
  <>
    <dt className="font-semibold text-gray-800">{label}:</dt>
    <dd className="text-gray-600">{value || "-"}</dd>
  </>
);

const FamilyDashboard = () => {
  const [family, setFamily] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || "https://uk-portal-3.com";
  const token = localStorage.getItem("familyToken");

  // Fetch family profile
  const fetchFamily = async () => {
    const res = await fetch(`${API_BASE}/api/family/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed fetching family");
    return res.json();
  };

  useEffect(() => {
    if (!token) {
      setMsg("⚠️ Please login first.");
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchFamily();
        setFamily(data);
        setMsg("");
      } catch (e) {
        setMsg("⚠️ Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // Upload document
  const handleUpload = async () => {
    if (!file) return setMsg("⚠️ Please select a file");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch(`${API_BASE}/api/family/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setFamily(await fetchFamily());
      setMsg("✅ File uploaded successfully");
      setFile(null);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/family/document/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setFamily(json.family);
      setMsg("✅ Document deleted successfully");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle tax paid
  const toggleTaxPaidStatus = async (taxId, currentStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/family/tax`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taxId, paid: !currentStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      setFamily(await fetchFamily());
      setMsg(`✅ Tax marked as ${!currentStatus ? "Paid" : "Pending"}`);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete tax
  const handleDeleteTax = async (taxId) => {
    if (!window.confirm("Delete this tax record?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/family/tax/${taxId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      setFamily(json.family);
      setMsg("✅ Tax record deleted");
    } catch (err) {
      setMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!family) {
    return (
      <div className="p-10 text-center text-gray-600 font-semibold animate-pulse">
        ⏳ Loading family data...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold text-center text-green-700">
        🏠 Family Dashboard
      </h1>

      {loading && <p className="text-blue-600 text-center">Processing...</p>}
      {msg && <p className="text-yellow-700 text-center">{msg}</p>}

      {/* Family Info */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
          Family Information
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <InfoItem label="Family ID" value={family.familyId} />
          <InfoItem label="Leader" value={family.leaderName} />
          <InfoItem label="Members" value={family.members?.join(", ")} />
          <InfoItem label="Address" value={family.address} />
          <InfoItem label="Email" value={family.email} />
          <InfoItem label="Phone" value={family.phone} />
        </dl>
      </section>

      {/* Taxes */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Taxes</h2>
        {family.taxHistory?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 border">Month</th>
                  <th className="p-3 border text-right">Amount (₹)</th>
                  <th className="p-3 border text-center">Status</th>
                  <th className="p-3 border text-center">Action</th>
                  <th className="p-3 border text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {family.taxHistory.map((tax) => (
                  <tr key={tax._id} className="hover:bg-gray-50">
                    <td className="p-3 border">{tax.month}</td>
                    <td className="p-3 border text-right">{tax.amount}</td>
                    <td
                      className={`p-3 border text-center font-bold ${
                        tax.paid ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tax.paid ? "Paid" : "Pending"}
                    </td>
                    <td className="p-3 border text-center">
                      <button
                        onClick={() => toggleTaxPaidStatus(tax._id, tax.paid)}
                        disabled={loading}
                        className={`px-4 py-1 rounded text-white ${
                          tax.paid
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        Mark as {tax.paid ? "Pending" : "Paid"}
                      </button>
                    </td>
                    <td className="p-3 border text-center">
                      <button
                        onClick={() => handleDeleteTax(tax._id)}
                        disabled={loading}
                        className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No tax records found.</p>
        )}
      </section>

      {/* Upload */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
          Upload Document
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="border rounded px-3 py-2 w-full sm:w-auto"
          />
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Upload
          </button>
        </div>
      </section>

      {/* Documents */}
      <section className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">
          Uploaded Documents
        </h2>
        {family.documents?.length ? (
          <ul className="space-y-3">
            {family.documents.map((doc) => (
              <li
                key={doc._id}
                className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50 px-3 py-2 rounded"
              >
                <span className="truncate max-w-xs">
                  {doc.originalName || doc.storedName}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(doc.uploadedAt).toLocaleString()}
                </span>
                <div className="flex gap-4">
                  <a
                    href={`${API_BASE}${doc.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="text-blue-600 hover:underline"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleDeleteDoc(doc._id)}
                    disabled={loading}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No documents uploaded.</p>
        )}
      </section>
    </div>
  );
};

export default FamilyDashboard;
