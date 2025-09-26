import React, { useEffect, useState } from "react";
import axios from "axios";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use environment variable for API URL
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/admin/events`);
        setEvents(res.data || []);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("⚠️ Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [API_BASE]);

  if (loading)
    return (
      <div className="p-8 text-center text-lg font-semibold animate-pulse">
        ⏳ Loading events...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 font-semibold">{error}</div>
    );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center text-green-700">
        🌿 Village Events
      </h2>

      {events.length === 0 ? (
        <p className="text-gray-600 text-center">No events available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <div
              key={event._id}
              className="border rounded-xl p-4 shadow hover:shadow-xl transition bg-white flex flex-col justify-between"
            >
              <h3 className="text-xl font-semibold text-gray-800">{event.title}</h3>
              {event.description && (
                <p className="text-gray-600 mt-2">{event.description}</p>
              )}
              {event.date && (
                <p className="text-gray-500 text-sm mt-4">
                  📅 {new Date(event.date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
