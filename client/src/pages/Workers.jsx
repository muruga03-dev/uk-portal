import React, { useEffect, useState } from "react";
import axios from "axios";

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const token = localStorage.getItem("adminToken"); // Admin token

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(`${API_BASE}/api/admin/workers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        setWorkers(res.data || []);
      } catch (err) {
        console.error("Error fetching workers:", err);
        if (err.response?.status === 401) {
          setError("⚠️ Unauthorized access. Please log in as admin.");
        } else {
          setError("⚠️ Failed to load worker types. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [API_BASE, token]);

  if (loading)
    return (
      <div className="p-8 text-center text-lg font-semibold animate-pulse">
        ⏳ Loading worker types...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 font-semibold">{error}</div>
    );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-green-700">
        Worker Types
      </h2>

      {workers.length === 0 ? (
        <p className="text-gray-600 text-lg text-center">
          No worker types available.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <div
              key={worker._id}
              className="border rounded-lg p-4 shadow-md hover:shadow-xl transition-transform duration-300 hover:scale-105 bg-white flex flex-col justify-between"
            >
              <h3 className="text-xl font-semibold mb-2">
                {worker.type || "Untitled Worker"}
              </h3>
              <p className="text-gray-700">
                {worker.description || "No description available."}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workers;
