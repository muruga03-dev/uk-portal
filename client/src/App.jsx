// client/src/App.jsx
import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom"; // ✅ HashRouter
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import History from "./pages/History";
import Events from "./pages/Events";
import Gallery from "./pages/Gallery";
import Workers from "./pages/Workers";
import FamilyLogin from "./pages/FamilyLogin";
import AdminLogin from "./pages/AdminLogin";
import FamilyDashboard from "./pages/FamilyDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import './i18n';
import './styles.css';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/events" element={<Events />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/workers" element={<Workers />} />
        <Route path="/family-login" element={<FamilyLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/family-dashboard" element={<FamilyDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
