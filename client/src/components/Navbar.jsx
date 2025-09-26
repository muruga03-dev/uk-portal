import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "../assets/uk logo.jpg";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || "en");
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "ta" : "en";
    i18n.changeLanguage(newLang);
    setLang(newLang);
  };

  const menuItems = [
    { name: t("home"), path: "/" },
    { name: t("history"), path: "/history" },
    { name: t("events"), path: "/events" },
    { name: t("gallery"), path: "/gallery" },
    { name: t("workers"), path: "/workers" },
    { name: t("familyLogin"), path: "/family-login" },
    { name: t("adminLogin"), path: "/admin-login" },
  ];

  return (
    <nav className="bg-green-700 text-white p-4">
      <div className="flex justify-between items-center">
        {/* Logo or Title */}
        <div className="text-xl font-bold flex items-center">
         <img
  src={logo}
  alt="Logo"
  className="w-10 h-10 mr-2 rounded-full shadow-md border-2 border-white object-cover"
/>
          {t("name")}
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6 items-center">
          {menuItems.map((item, index) => (
            <Link key={index} to={item.path} className="hover:text-yellow-300">
              {item.name}
            </Link>
          ))}
          <button
            onClick={toggleLanguage}
            className="bg-yellow-400 text-black px-3 py-1 rounded"
          >
            🌐 {lang === "en" ? "TA" : "EN"}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-4 flex flex-col space-y-3">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              onClick={() => setIsOpen(false)} // Close menu on click
              className="hover:text-yellow-300"
            >
              {item.name}
            </Link>
          ))}
          <button
            onClick={toggleLanguage}
            className="bg-yellow-400 text-black px-3 py-1 rounded"
          >
            🌐 {lang === "en" ? "TA" : "EN"}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
