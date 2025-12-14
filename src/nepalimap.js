import React, { useEffect, useRef, useState } from "react";

const LABELS = {
  koshi: "Koshi (Province 1)",
  madhesh: "Madhesh (Province 2)",
  bagmati: "Bagmati (Province 3)",
  gandaki: "Gandaki (Province 4)",
  lumbini: "Lumbini (Province 5)",
  karnali: "Karnali (Province 6)",
  sudurpashchim: "Sudurpashchim (Province 7)",
};

const PROVINCE_INFO = {
  koshi: {
    name: "Koshi (Province 1)",
    description: "Province 1 is located in the eastern part of Nepal, bordering India. It's known for its diverse ethnic groups and rich cultural heritage.",
    funFacts: [
      "Home to the famous Ilam tea gardens",
      "Contains the highest peak in the world, Mount Everest",
      "Rich in biodiversity with many national parks",
      "Known for its traditional Limbu and Rai cultures"
    ]
  },
  madhesh: {
    name: "Madhesh (Province 2)",
    description: "Madhesh Province is the southernmost province of Nepal, characterized by its flat Terai plains and agricultural productivity.",
    funFacts: [
      "Known as the 'breadbasket' of Nepal",
      "Home to the famous Chitwan National Park",
      "Rich in agricultural production",
      "Has a unique Madhesi culture and traditions"
    ]
  },
  bagmati: {
    name: "Bagmati (Province 3)",
    description: "Bagmati Province is the most populous province and contains the capital city Kathmandu. It's the political and cultural heart of Nepal.",
    funFacts: [
      "Contains the capital city Kathmandu",
      "Home to UNESCO World Heritage Sites",
      "Center of Nepal's political and economic activities",
      "Rich in Newari culture and architecture"
    ]
  },
  gandaki: {
    name: "Gandaki (Province 4)",
    description: "Gandaki Province is known for its beautiful lakes, mountains, and the famous tourist destination Pokhara.",
    funFacts: [
      "Home to the beautiful Pokhara city",
      "Contains the famous Phewa Lake",
      "Gateway to the Annapurna Circuit trek",
      "Rich in Gurung and Magar cultures"
    ]
  },
  lumbini: {
    name: "Lumbini (Province 5)",
    description: "Lumbini Province is the birthplace of Lord Buddha and is a major pilgrimage site for Buddhists worldwide.",
    funFacts: [
      "Birthplace of Lord Buddha",
      "UNESCO World Heritage Site",
      "Major Buddhist pilgrimage destination",
      "Rich in Tharu culture and traditions"
    ]
  },
  karnali: {
    name: "Karnali (Province 6)",
    description: "Karnali Province is the largest and most remote province, known for its rugged terrain and traditional way of life.",
    funFacts: [
      "Largest province in Nepal",
      "Most remote and least developed region",
      "Home to the Karnali River",
      "Rich in traditional mountain cultures"
    ]
  },
  sudurpashchim: {
    name: "Sudurpashchim (Province 7)",
    description: "Sudurpashchim Province is the westernmost province, known for its diverse geography from mountains to plains.",
    funFacts: [
      "Westernmost province of Nepal",
      "Contains the famous Rara Lake",
      "Home to diverse ethnic groups",
      "Known for its traditional festivals"
    ]
  }
};

const NepalMap = ({ onSelect }) => {
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Load the external SVG once; avoids pasting heavy inline SVG into your editor.
    const img = document.createElement("img");
    img.src = "/NepalProvinces.svg";
    img.alt = "Nepal provinces map";
    img.decoding = "async";
    img.loading = "eager"; // it's small; keeps hover snappy

    // When loaded, replace <img> with the inline SVG so we can attach events.
    img.addEventListener("load", async () => {
      try {
      const res = await fetch(img.src);
      const svgText = await res.text();
      const temp = document.createElement("div");
      temp.innerHTML = svgText;
      const svg = temp.querySelector("svg");
      if (!svg) return;

      // Basic accessible attributes
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", "Map of Nepal by province");

      // Style provinces via CSS classes to avoid inline bloat
      svg.querySelectorAll("[id]").forEach((el) => {
        const id = el.getAttribute("id")?.toLowerCase() || "";
        // Expect province ids like "province-1","madhesh","bagmati","gandaki","lumbini","karnali","sudurpashchim"
        if (LABELS[id]) {
          el.classList.add("province");
            el.tabIndex = 0; // keyboard focusable
          el.setAttribute("data-name", LABELS[id]);
            el.addEventListener("mouseenter", () => {
              setHover(id);
              setSelectedProvince(PROVINCE_INFO[id]);
            });
            el.addEventListener("mouseleave", () => {
              setHover(null);
              setSelectedProvince(null);
            });
            el.addEventListener("click", () => {
              onSelect?.(id);
              setSelectedProvince(PROVINCE_INFO[id]);
            });
            el.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
                onSelect?.(id);
                setSelectedProvince(PROVINCE_INFO[id]);
            }
          });
        }
      });

      // Swap into DOM
      container.innerHTML = "";
      container.appendChild(svg);
      } catch (error) {
        console.error("Error loading SVG:", error);
        // Fallback to a simple message if SVG fails to load
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Map loading...</div>';
      }
    });

    container.innerHTML = "";
    container.appendChild(img);
  }, [onSelect]);

  return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0px',
        maxWidth: '800px',
        margin: '0 auto',
        height: 'auto',
        padding: '0 10px'
      }}>
              {/* Map Container */}
        <div style={{
          position: 'relative',
          height: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: '200px',
          marginBottom: '15px'
        }}>
      <div
        ref={containerRef}
          style={{
            width: '100%',
            maxWidth: '750px',
            height: '100%',
            margin: '0 auto'
          }}
        aria-live="polite"
      />
        
        {/* Hover tooltip - only show when hovering and no province is selected */}
        {hover && !selectedProvince && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #ddd',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {LABELS[hover]}
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="info-panel" style={{
        width: '100%',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #ddd',
        minHeight: '150px',
        boxSizing: 'border-box'
      }}>
        {selectedProvince ? (
          <div>
            <h3 className="info-title" style={{
              color: '#2c3e50',
              marginBottom: '12px',
              fontSize: '22px',
              fontWeight: '600'
            }}>
              {selectedProvince.name}
            </h3>
            <p className="info-description" style={{
              color: '#34495e',
              lineHeight: '1.5',
              marginBottom: '15px',
              fontSize: '15px'
            }}>
              {selectedProvince.description}
            </p>
            <h4 className="info-subtitle" style={{
              color: '#2c3e50',
              marginBottom: '8px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Fun Facts:
            </h4>
            <ul className="info-list" style={{
              color: '#34495e',
              lineHeight: '1.4',
              paddingLeft: '18px',
              fontSize: '14px'
            }}>
              {selectedProvince.funFacts.map((fact, index) => (
                <li key={index} style={{ marginBottom: '6px' }}>{fact}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h3 className="welcome-title" style={{
              color: '#2c3e50',
              marginBottom: '15px',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Welcome to Nepal!
            </h3>
            <p className="welcome-text" style={{
              color: '#34495e',
              lineHeight: '1.6',
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              Hover over or click on a province on the map to learn more about it!
            </p>
            <p className="welcome-text" style={{
              color: '#34495e',
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              Each province has its own unique culture, geography, and fascinating facts to discover.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .province {
          transition: transform 120ms ease, filter 120ms ease, fill 120ms ease;
          cursor: pointer;
          outline: none;
        }
        .province:hover,
        .province:focus {
          filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.25));
        }
        /* Default neutral fill so it blends with your theme; override in app CSS if needed */
        .province {
          fill: #e5e7eb; /* tailwind zinc-200 */
          stroke: #111827; /* zinc-900 */
          stroke-width: 0.6;
        }
        .province:hover,
        .province:focus {
          fill: #a7f3d0; /* emerald-200 */
        }

      `}</style>
    </div>
  );
};

export default NepalMap;
