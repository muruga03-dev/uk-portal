import React, { useEffect, useState } from "react";
import axios from "axios";
import GalleryModal from "../components/GalleryModal";

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/gallery");
        const safeImages = res.data.map(img => ({
          ...img,
          url: img.url.replace(/ /g, "%20")
        }));
        setImages(safeImages);
      } catch (err) {
        console.error("Error fetching gallery:", err);
        setError("⚠️ Failed to load gallery. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

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
        🌸 Village Photo Gallery
      </h2>

      {images.length === 0 ? (
        <p className="text-gray-600 text-lg text-center">
          No images available in the gallery.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img, idx) => {
            const imageUrl = `http://localhost:5000${img.url}`;
            return (
              <div
                key={idx}
                className="relative cursor-pointer overflow-hidden rounded-3xl shadow-xl transform transition duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-1 group"
                style={{ aspectRatio: "1 / 1" }} // square image
                onClick={() => setSelectedImage(imageUrl)}
              >
                {/* Image */}
                <img
                  src={imageUrl}
                  alt={img.title || `Gallery ${idx}`}
                  className="w-full h-full object-cover rounded-3xl filter brightness-90 group-hover:brightness-100 transition duration-500"
                  onError={(e) => (e.target.src = "/fallback.png")}
                />

                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition duration-500">
                  <h3 className="text-white text-center font-bold text-lg px-2">
                    {img.title || "View Image"}
                  </h3>
                </div>

                {/* Shadow glow animation */}
                <div className="absolute inset-0 rounded-3xl shadow-[0_0_15px_rgba(0,128,0,0.5)] opacity-0 group-hover:opacity-100 transition duration-500"></div>
              </div>
            );
          })}
        </div>
      )}

      {selectedImage && (
        <GalleryModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
};

export default Gallery;
