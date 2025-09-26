import React, { useEffect, useState } from "react";
import axios from "axios";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/events");
        setEvents(res.data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-lg font-semibold">
        Loading events...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Village Events</h2>
      {events.length === 0 ? (
        <p className="text-gray-600">No events available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <div
              key={event._id}
              className="border rounded-lg p-4 shadow hover:shadow-lg transition bg-white"
            >
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <p className="text-gray-700 mt-2">{event.description}</p>
              {event.date && (
                <p className="text-gray-500 text-sm mt-3">
                  {new Date(event.date).toLocaleDateString()}
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
