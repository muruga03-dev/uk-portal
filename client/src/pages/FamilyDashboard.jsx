import React, { useEffect, useState } from "react";
import axios from "axios";

const FamilyDashboard = () => {
  const [family, setFamily] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("familyToken");

  // Fetch family profile
  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/family/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFamily(res.data);
      } catch (err) {
        console.error("Error fetching family profile:", err);
        setMsg("⚠️ Failed to load family data");
      }
    };
    if (token) fetchFamily();
  }, [token, API_BASE]);

  // Handle document upload
  const handleUpload = async () => {
    if (!file) return setMsg("⚠️ Please select a file");
    const formData = new FormData();
    formData.append("document", file);

    try {
      const res = await axios.post(`${API_BASE}/api/family/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.family) setFamily(res.data.family);
      setFile(null);
      setMsg("✅ File uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      setMsg("⚠️ Upload failed");
    }
  };

  // Handle document delete
  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await axios.delete(`${API_BASE}/api/family/document/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.family) setFamily(res.data.family);
      setMsg("✅ Document deleted successfully");
    } catch (err) {
      console.error("Delete error:", err);
      setMsg("⚠️ Failed to delete document");
    }
  };

  if (!family)
    return (
      <div className="p-8 text-center text-lg font-semibold animate-pulse">
        ⏳ Loading family data...
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-center mb-6 text-green-700">
        🏠 Family Dashboard
      </h2>

      {/* Family Info */}
      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <tbody>
          <tr className="bg-gray-50">
            <td className="p-2 font-semibold">Family ID</td>
            <td className="p-2">{family.familyId}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Leader</td>
            <td className="p-2">{family.leaderName}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="p-2 font-semibold">Members</td>
            <td className="p-2">{family.members?.join(", ") || "-"}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Address</td>
            <td className="p-2">{family.address || "-"}</td>
          </tr>
          <tr className="bg-gray-50">
            <td className="p-2 font-semibold">Email</td>
            <td className="p-2">{family.email || "-"}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Phone</td>
            <td className="p-2">{family.phone || "-"}</td>
          </tr>
        </tbody>
      </table>

      {/* Tax Info */}
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2 text-lg">Tax Information</h3>
        {family.taxHistory?.length > 0 ? (
          <table className="w-full border border-gray-200 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Month</th>
                <th className="p-2 border">Amount (INR)</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {family.taxHistory.map((tax) => (
                <tr key={tax._id} className="text-center">
                  <td className="p-2 border">{tax.month}</td>
                  <td className="p-2 border">{tax.amount}</td>
                  <td className={`p-2 border ${tax.paid ? "text-green-600" : "text-red-600"}`}>
                    {tax.paid ? "Paid" : "Pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No tax records found.</p>
        )}
      </div>

      {/* Document Upload */}
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2 text-lg">Upload Document</h3>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <button
          onClick={handleUpload}
          className="ml-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
        >
          Upload
        </button>
        {msg && <p className="mt-2 text-green-700">{msg}</p>}
      </div>

      {/* Uploaded Documents */}
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2 text-lg">Uploaded Documents</h3>
        <ul className="list-disc pl-6">
          {family.documents?.length > 0 ? (
            family.documents.map((doc) => (
              <li key={doc._id} className="flex items-center justify-between mb-1">
                <div>
                  <span className="font-medium">{doc.filename}</span>{" "}
                  <span className="text-gray-500 text-sm">({new Date(doc.uploadedAt).toLocaleDateString()})</span>
                </div>
                <div className="space-x-2">
                  <a
                    href={`${API_BASE}${doc.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                    download
                  >
                    Download
                  </a>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="text-red-600 underline"
                  >
                    Clear
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li>No documents uploaded.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FamilyDashboard;
