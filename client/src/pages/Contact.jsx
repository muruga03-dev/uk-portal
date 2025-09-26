import React, { useState } from "react";
import axios from "axios";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [msg, setMsg] = useState({ text: "", type: "" }); // type: "success" | "error"
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setMsg({ text: "All fields are required.", type: "error" });
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/contact`, form);
      setMsg({ text: "Message sent successfully!", type: "success" });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      setMsg({ text: "Failed to send message. Try again later.", type: "error" });
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-green-700">Contact Us</h2>
      {msg.text && (
        <p
          className={`mb-4 text-center font-semibold ${
            msg.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {msg.text}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
        <textarea
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="border p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={5}
          required
        />
        <button
          type="submit"
          className="bg-green-700 hover:bg-green-800 transition text-white px-4 py-2 rounded w-full"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Contact;
