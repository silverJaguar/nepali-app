import React from "react";

const AlphabetMenu = ({ units, onSelect }) => (
  <div className="p-4 border rounded-lg shadow">
    <h2 className="text-xl font-bold">Select an Alphabet Section</h2>
    {units.map((unit, index) => (
      <button
        key={unit}
        className="block my-1 px-4 py-2 bg-gray-200 rounded w-full text-left"
        onClick={() => onSelect(index)}
      >
        {unit}
      </button>
    ))}
  </div>
);

export default AlphabetMenu;
