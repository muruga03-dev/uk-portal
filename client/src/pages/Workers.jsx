import React, { useEffect, useState } from "react";
import axios from "axios";

const Workers = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/admin/workers`);
        setWorkers(res.data || []);
      } catch (err) {
        console.error("Error fetching workers:", err);
        setError("⚠️ Failed to load worker types. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [API_BASE]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workers.map((worker) => (
            <div
              key={worker._id}
              className="border rounded-lg p-4 shadow-md hover:shadow-xl transition-transform duration-300 hover:scale-105 bg-white"
            >
              <h3 className="text-xl font-semibold mb-2">{worker.type}</h3>
              <p className="text-gray-700">{worker.description || "No description available."}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Workers;
