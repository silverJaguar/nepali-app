// CultureMenu.js
import React from "react";

const CultureMenu = ({ onSelectCategory }) => {
  const categories = [
    "Daily Life",
    "Religion",
    "Food",
    "Slang",
    "Traditions",
    "Social Etiquette",
    "Map",
  ];

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-xl font-bold">Explore Culture</h2>
      {categories.map((category) => (
        <button
          key={category}
          className="pastel-button"
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CultureMenu;
