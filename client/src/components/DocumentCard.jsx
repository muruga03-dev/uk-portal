// Placeholder for client/src/components/DocumentCard.jsx
// DocumentCard.jsx
import React from "react";
import { FaFileAlt, FaDownload } from "react-icons/fa";

const DocumentCard = ({ doc }) => {
  return (
    <div className="flex justify-between items-center bg-white shadow p-3 rounded-md border mb-2">
      <div className="flex items-center gap-3">
        <FaFileAlt className="text-blue-600 text-xl" />
        <div>
          <p className="font-semibold">{doc.fileName}</p>
          <p className="text-xs text-gray-500">Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</p>
        </div>
      </div>
      <a
        href={`http://localhost:5000/${doc.filePath}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        <FaDownload className="mr-1" /> Download
      </a>
    </div>
  );
};

export default DocumentCard;
