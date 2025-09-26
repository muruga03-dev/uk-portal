import React, { useEffect, useState } from "react";
import axios from "axios";

const FamilyDashboard = () => {
  const [family, setFamily] = useState(null);
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("familyToken");

  // Fetch family profile
  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/family/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFamily(res.data);
      } catch (err) {
        console.error("Error fetching family profile:", err);
        setMsg("Failed to load family data");
      }
    };
    if (token) fetchFamily();
  }, [token]);

  // Handle document upload
  const handleUpload = async () => {
    if (!file) {
      setMsg("Please select a file");
      return;
    }
    const formData = new FormData();
    formData.append("document", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/family/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (res.data.family) setFamily(res.data.family);
      setFile(null);
      setMsg("File uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      setMsg("Upload failed");
    }
  };

  if (!family) return <div className="p-6">Loading...</div>;

  const latestTax =
    family.taxHistory?.length > 0
      ? family.taxHistory[family.taxHistory.length - 1]
      : null;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Family Dashboard</h2>

      {/* Family Info */}
      <table className="w-full border mb-6">
        <tbody>
          <tr>
            <td className="p-2 font-semibold">Family ID</td>
            <td className="p-2">{family.familyId}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Leader</td>
            <td className="p-2">{family.leaderName}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Members</td>
            <td className="p-2">{(family.members || []).join(", ")}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Address</td>
            <td className="p-2">{family.address || "-"}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Email</td>
            <td className="p-2">{family.email || "-"}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Phone</td>
            <td className="p-2">{family.phone || "-"}</td>
          </tr>
          <tr>
            <td className="p-2 font-semibold">Current Tax</td>
            <td className="p-2">
              {latestTax
                ? `${latestTax.amount} INR (${latestTax.paid ? "Paid" : "Pending"})`
                : "0 INR"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Document Upload */}
      <div className="mb-6">
        <h3 className="font-semibold mb-2">Upload Document</h3>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button
          onClick={handleUpload}
          className="ml-2 bg-blue-600 text-white px-3 py-1 rounded"
        >
          Upload
        </button>
        {msg && <p className="mt-2 text-green-700">{msg}</p>}
      </div>

      {/* Uploaded Documents */}
      <div>
        <h3 className="font-semibold mb-2">Uploaded Documents</h3>
        <ul className="list-disc pl-6">
          {family.documents?.length > 0 ? (
            family.documents.map((d, i) => (
              <li key={i} className="flex items-center justify-between mb-1">
                <span>{d.filename}</span>
                <a
                  href={`http://localhost:5000${d.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline ml-4"
                  download
                >
                  Download
                </a>
              </li>
            ))
          ) : (
            <li>No documents uploaded</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FamilyDashboard;
