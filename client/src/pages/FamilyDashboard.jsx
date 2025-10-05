import React, { useEffect, useState } from "react";
import axios from "axios";

const FamilyDashboard = () => {
  const [family, setFamily] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("familyToken");

  // Fetch family profile
  useEffect(() => {
    const fetchFamily = async () => {
      if (!token) {
        setMsg("⚠️ No authentication token found. Please login.");
        return;
      }
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/family/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFamily(res.data);
        setMsg("");
      } catch (err) {
        console.error("Error fetching family profile:", err.response || err);
        setMsg(err.response?.data?.message || "⚠️ Failed to load family data. Please login again.");
      } finally {
        setLoading(false);
      }
    };
    fetchFamily();
  }, [token, API_BASE]);

  // Handle document upload
  const handleUpload = async () => {
    if (!file) {
      setMsg("⚠️ Please select a file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("document", file);

    try {
      const res = await axios.post(`${API_BASE}/api/family/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      
      if (res.data.family) {
        setFamily(res.data.family);
      }
      setFile(null);
      setMsg("✅ File uploaded successfully");
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
      
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Upload error:", err.response || err);
      setMsg(err.response?.data?.message || "⚠️ Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle document download
  const handleDownload = async (document) => {
    try {
      setLoading(true);
      
      // Use direct download link since the file is served statically
      const downloadUrl = `${API_BASE}${document.path}`;
      
      // Create a temporary link for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = document.originalName;
      link.target = '_blank'; // Open in new tab for viewing
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMsg("✅ Download started");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Download error:", err);
      setMsg("⚠️ Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle document delete
  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    setLoading(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/family/document/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.family) {
        setFamily(res.data.family);
      }
      setMsg("✅ Document deleted successfully");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Delete error:", err.response || err);
      setMsg(err.response?.data?.message || "⚠️ Failed to delete document");
    } finally {
      setLoading(false);
    }
  };

  // Handle tax delete
  const handleDeleteTax = async (taxId) => {
    if (!window.confirm("Are you sure you want to delete this tax record?")) return;
    
    setLoading(true);
    try {
      const res = await axios.delete(`${API_BASE}/api/family/tax/${taxId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.family) {
        setFamily(res.data.family);
      }
      setMsg("✅ Tax record deleted successfully");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      console.error("Delete tax error:", err.response || err);
      setMsg(err.response?.data?.message || "⚠️ Failed to delete tax record");
    } finally {
      setLoading(false);
    }
  };

  // Navigation Tabs Component
  const NavigationTabs = () => (
    <div className="flex overflow-x-auto border-b mb-6 bg-white rounded-lg shadow-sm">
      {[
        { id: "profile", label: "Profile", icon: "👤" },
        { id: "tax", label: "Tax Records", icon: "💰" },
        { id: "documents", label: "Documents", icon: "📁" }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 min-w-32 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "border-b-2 border-green-600 text-green-600 bg-green-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );

  // Profile Section
  const ProfileSection = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Family Information</h3>
      
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="bg-gray-50 p-4 border-b md:border-b-0 md:border-r">
            <div className="space-y-4">
              <InfoRow label="Family ID" value={family.familyId} />
              <InfoRow label="Leader Name" value={family.leaderName} />
              <InfoRow label="Email" value={family.email} />
              <InfoRow label="Status" value={
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  family.approved 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {family.approved ? "Approved" : "Pending Approval"}
                </span>
              } />
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <InfoRow label="Phone" value={family.phone} />
              <InfoRow label="Address" value={family.address} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Members</label>
                <div className="text-gray-900">
                  {family.members && family.members.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {family.members.map((member, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {member}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-500">No members listed</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Tax Section
  const TaxSection = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-xl font-bold text-gray-800">Tax Records</h3>
        <div className="text-sm text-gray-600">
          Total Records: <span className="font-semibold">{family.taxHistory ? family.taxHistory.length : 0}</span>
        </div>
      </div>

      {family.taxHistory && family.taxHistory.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-left font-medium text-gray-700">Month</th>
                    <th className="p-3 text-left font-medium text-gray-700">Amount (₹)</th>
                    <th className="p-3 text-left font-medium text-gray-700">Status</th>
                    <th className="p-3 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {family.taxHistory.map((tax) => (
                    <tr key={tax._id} className="hover:bg-gray-50">
                      <td className="p-3 text-gray-900 font-medium">{tax.month}</td>
                      <td className="p-3 text-gray-900">₹{tax.amount}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tax.paid
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tax.paid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDeleteTax(tax._id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                          title="Delete tax record"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {family.taxHistory.filter(tax => tax.paid).length}
              </div>
              <div className="text-sm text-green-700 font-medium">Paid Taxes</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {family.taxHistory.filter(tax => !tax.paid).length}
              </div>
              <div className="text-sm text-red-700 font-medium">Pending Taxes</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{family.taxHistory.reduce((sum, tax) => sum + (tax.paid ? Number(tax.amount) : 0), 0)}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total Paid</div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">💰</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Tax Records</h4>
          <p className="text-gray-600">No tax records found for your family.</p>
        </div>
      )}
    </div>
  );

  // Documents Section
  const DocumentsSection = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Document Management</h3>

      {/* Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h4 className="font-semibold text-lg mb-4 text-gray-800">Upload New Document</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Document
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
            />
            <p className="mt-1 text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT
            </p>
          </div>
          
          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">{file.name}</p>
                  <p className="text-sm text-blue-700">
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors font-medium w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              "Upload Document"
            )}
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>Uploaded Documents</span>
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
              {family.documents ? family.documents.length : 0}
            </span>
          </h4>
        </div>

        {family.documents && family.documents.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {family.documents.map((doc) => (
              <div key={doc._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getFileIcon(doc.originalName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {doc.originalName || "Unnamed Document"}
                      </div>
                      <div className="text-sm text-gray-600">
                        Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "Unknown date"}
                      </div>
                      {doc.path && (
                        <div className="text-xs text-blue-600 mt-1">
                          Path: {doc.path}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors text-center flex-1 sm:flex-none flex items-center justify-center gap-2"
                  >
                    <span>📥</span>
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex-1 sm:flex-none flex items-center justify-center gap-2"
                  >
                    <span>🗑️</span>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Documents</h4>
            <p className="text-gray-600">No documents uploaded yet. Upload your first document above.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Helper function for file icons
  const getFileIcon = (filename) => {
    if (!filename) return '📎';
    
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'txt':
        return '📃';
      default:
        return '📎';
    }
  };

  // Helper component for info rows
  const InfoRow = ({ label, value }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="text-gray-900">
        {value !== undefined && value !== null && value !== '' ? value : <span className="text-gray-500">-</span>}
      </div>
    </div>
  );

  if (!family) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading family data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-2">
            🏠 Family Dashboard
          </h1>
          <p className="text-gray-600">Welcome back, {family.leaderName}!</p>
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

        {msg && (
          <div className={`p-4 rounded-lg text-center mb-6 ${
            msg.includes("✅") 
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-yellow-50 border border-yellow-200 text-yellow-700"
          }`}>
            {msg}
          </div>
        )}

        {/* Navigation Tabs */}
        <NavigationTabs />

        {/* Content Section */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          {activeTab === "profile" && <ProfileSection />}
          {activeTab === "tax" && <TaxSection />}
          {activeTab === "documents" && <DocumentsSection />}
        </div>
      </div>
    </div>
  );
};

export default FamilyDashboard;