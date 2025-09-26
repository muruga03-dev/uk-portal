import React from "react";

const GoogleMap = () => {
  return (
    <div className="map-container">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3936.5728684164947!2d78.3140369!3d9.3710121!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0115fc3e35133d%3A0xf3b76cfb65350deb!2sSri%20Uchama%20Kaliamman%20Temple!5e0!3m2!1sen!2sin!4v1758646588879!5m2!1sen!2sin"
        width="100%"
        height="450"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Sri Uchama Kaliamman Temple Map"
      ></iframe>
    </div>
  );
};

export default GoogleMap;
