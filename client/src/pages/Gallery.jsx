import React, { useEffect, useState } from "react";
import GalleryModal from "../components/GalleryModal";
import axios from "axios";

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Backend API
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/admin/gallery`);

        const safeImages = (res.data || []).map((img) => {
          let finalUrl = "/fallback.png";

          if (img?.url) {
            finalUrl = img.url.startsWith("http")
              ? img.url
              : `${API_BASE}${img.url.replace(/ /g, "%20")}`;
          }

          return { ...img, url: finalUrl };
        });

        setImages(safeImages);
      } catch (err) {
        console.error("Error fetching gallery:", err);
        setError("⚠️ Failed to load gallery. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchGallery();
  }, [API_BASE]);

  if (loading)
    return (
      <div className="p-8 text-center text-lg font-semibold animate-pulse">
        ⏳ Loading gallery...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 font-semibold">{error}</div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold mb-12 text-center text-green-700 animate-fadeIn">
        🖼️ Village Photo Gallery
      </h2>

      {images.length === 0 ? (
        <p className="text-gray-600 text-lg text-center">
          No images available in the gallery.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group cursor-pointer overflow-hidden rounded-3xl shadow-lg transition-transform duration-500 hover:scale-105 hover:shadow-2xl"
              style={{ aspectRatio: "1 / 1" }}
              onClick={() => setSelectedImage(img.url)}
            >
              <img
                src={img.url}
                alt={img?.title || `Gallery ${idx + 1}`}
                className="w-full h-full object-cover rounded-3xl transition-transform duration-500 group-hover:scale-110 filter brightness-90 group-hover:brightness-100"
                onError={(e) => (e.target.src = "/fallback.png")}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <h3 className="text-white text-center font-bold text-lg px-2">
                  {img?.title || "View Image"}
                </h3>
              </div>
              <div className="absolute inset-0 rounded-3xl border-2 border-green-400 border-dashed opacity-0 group-hover:opacity-100 animate-pulse"></div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <GalleryModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

export default Gallery;
