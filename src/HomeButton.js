import React from "react";
import { FiHome } from "react-icons/fi";

const HomeButton = ({ currentSection, goHome }) => {
  if (currentSection === null) return null; // hide on main menu

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
