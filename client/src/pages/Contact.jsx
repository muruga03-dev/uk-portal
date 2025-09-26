import React, { useState } from "react";
import axios from "axios";

const Contact = () => {
  const [form, setForm] = useState({ name:"", email:"", message:"" });
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/contact", form);
      setMsg("Message sent successfully!");
      setForm({ name:"", email:"", message:"" });
    } catch (err) {
      setMsg("Failed to send message.");
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
      {msg && <p className="mb-2">{msg}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="border p-2 w-full rounded" required/>
        <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="border p-2 w-full rounded" required/>
        <textarea placeholder="Message" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="border p-2 w-full rounded" required/>
        <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded">Send</button>
      </form>
    </div>
  );
};

export default Contact;
