// client/src/pages/Home.jsx
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import GoogleMap from "./GoogleMap";
import "../styles.css"; // import styles
import Footer from "../components/Footer";
import Contact from "./Contact";

const Home = () => {
  const { t } = useTranslation();

  // refs for sections
  const aboutRef = useRef(null);
  const howToUseRef = useRef(null);

  // scroll function
  const scrollToSection = (ref) => {
    ref.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">{t("welcome")}</h1>
          <p className="hero-subtitle">{t("explain")}</p>
          <button
            className="hero-button"
            onClick={() => scrollToSection(aboutRef)}
          >
            👇 Explore More
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" ref={aboutRef}>
        <h2 className="section-title"> ⚔ {t("about")}</h2>
        <p className="section-text">{t("value")}</p>
        <button
          className="hero-button mt-4"
          onClick={() => scrollToSection(howToUseRef)}
        >
          👉 Next: How to Use
        </button>
      </section>

      {/* How to Use Section */}
      <section className="how-to-use-section" ref={howToUseRef}>
        <h2 className="section-title">📖 {t("howToUse")}</h2>
        <div className="steps-grid">
          <div className="step-card">
            <h3 className="step-title">👨‍👩‍👧‍👦 {t("familyLoginStep")}</h3>
            <p className="step-text">
              
            </p>
          </div>
          <div className="step-card">
            <h3 className="step-title">🛠️ {t("manageWorkers")}</h3>
            <p className="step-text">
              {t("adminLoginStep")}
            </p>
          </div>
          <div className="step-card">
            <h3 className="step-title">🎉 {t("exploreEvents")}</h3>
            <p className="step-text">
              {t("exploreEvents")}
              {t("exploreEventsDetails")}
            </p>
          </div>
          <div className="step-card">
            <h3 className="step-title">🖼️ {t("viewGallery")}</h3>
            <p className="step-text">
              {t("viewGalleryDetails")}
              
            </p>
          </div>
          <div className="step-card">
            <h3 className="step-title">📜 {t("history")}</h3>
            <p className="step-text">
              {t("historyDetails")}
            </p>
          </div>
        </div>
      </section>

      {/* Google Map Section */}
      <section className="map-section">
        <h2 className="section-title">📍 {t("findUsOnMap")}</h2>
        <div className="map-container">
          <GoogleMap />
        </div>
      </section>
      <Contact />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
