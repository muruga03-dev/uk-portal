// Placeholder for client/src/components/GalleryModal.jsx
import React from "react";

const GalleryModal = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="relative">
        <img src={image} alt="Gallery" className="max-h-[80vh] rounded"/>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-red-600 px-2 py-1 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default GalleryModal;
