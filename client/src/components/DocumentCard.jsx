// client/src/components/DocumentCard.jsx
import React from "react";
import { FaFileAlt, FaDownload } from "react-icons/fa";

const DocumentCard = ({ doc }) => {
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  if (!doc) return null; // safety check

  return (
    <div className="flex justify-between items-center bg-white shadow p-3 rounded-md border mb-2">
      <div className="flex items-center gap-3">
        <FaFileAlt className="text-blue-600 text-xl" />
        <div>
          <p className="font-semibold">{doc.filename || "Untitled Document"}</p>
          <p className="text-xs text-gray-500">
            Uploaded:{" "}
            {doc.uploadedAt
              ? new Date(doc.uploadedAt).toLocaleDateString()
              : "Unknown"}
          </p>
        </div>
      </div>
      {doc.path && (
        <a
          href={`${API_BASE}${doc.path}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Download ${doc.filename}`}
          className="flex items-center bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
          download
        >
          <FaDownload className="mr-1" /> Download
        </a>
      )}
    </div>
  );
};

export default DocumentCard;
