import React from "react";
import { IoSettingsOutline } from "react-icons/io5";

const SettingsButton = ({ onClick, isHomeButtonVisible }) => {
  return (
    <button
      onClick={onClick}
      className={`settings-fab ${isHomeButtonVisible ? 'settings-fab-under-home' : 'settings-fab-corner'}`}
      aria-label="Settings"
    >
      <IoSettingsOutline size={24} />
    </button>
  );
};

export default SettingsButton;

