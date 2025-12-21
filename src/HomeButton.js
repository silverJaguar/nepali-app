import React from "react";
import { FiHome } from "react-icons/fi";

const HomeButton = ({ currentSection, goHome }) => {
  // Show button on all pages except main menu
  if (currentSection === null) return null;

  return (
    <button
      onClick={goHome}
      className="home-fab"
      aria-label="Go Home"
    >
      <FiHome size={28} />
    </button>
  );
};

export default HomeButton;
