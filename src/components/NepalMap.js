import React, { useState } from 'react';

const NepalMap = () => {
  const [selectedProvince, setSelectedProvince] = useState(null);

  const provinces = {
    "Province 1": {
      name: "Province 1",
      description: "Province 1 is located in the eastern part of Nepal, bordering India. It's known for its diverse ethnic groups and rich cultural heritage.",
      funFacts: [
        "Home to the famous Ilam tea gardens",
        "Contains the highest peak in the world, Mount Everest",
        "Rich in biodiversity with many national parks",
        "Known for its traditional Limbu and Rai cultures"
      ]
    },
    "Madhesh": {
      name: "Madhesh Province",
      description: "Madhesh Province is the southernmost province of Nepal, characterized by its flat Terai plains and agricultural productivity.",
      funFacts: [
        "Known as the 'breadbasket' of Nepal",
        "Home to the famous Chitwan National Park",
        "Rich in agricultural production",
        "Has a unique Madhesi culture and traditions"
      ]
    },
    "Bagmati": {
      name: "Bagmati Province",
      description: "Bagmati Province is the most populous province and contains the capital city Kathmandu. It's the political and cultural heart of Nepal.",
      funFacts: [
        "Contains the capital city Kathmandu",
        "Home to UNESCO World Heritage Sites",
        "Center of Nepal's political and economic activities",
        "Rich in Newari culture and architecture"
      ]
    },
    "Gandaki": {
      name: "Gandaki Province",
      description: "Gandaki Province is known for its beautiful lakes, mountains, and the famous tourist destination Pokhara.",
      funFacts: [
        "Home to the beautiful Pokhara city",
        "Contains the famous Phewa Lake",
        "Gateway to the Annapurna Circuit trek",
        "Rich in Gurung and Magar cultures"
      ]
    },
    "Lumbini": {
      name: "Lumbini Province",
      description: "Lumbini Province is the birthplace of Lord Buddha and is a major pilgrimage site for Buddhists worldwide.",
      funFacts: [
        "Birthplace of Lord Buddha",
        "UNESCO World Heritage Site",
        "Major Buddhist pilgrimage destination",
        "Rich in Tharu culture and traditions"
      ]
    },
    "Karnali": {
      name: "Karnali Province",
      description: "Karnali Province is the largest and most remote province, known for its rugged terrain and traditional way of life.",
      funFacts: [
        "Largest province in Nepal",
        "Most remote and least developed region",
        "Home to the Karnali River",
        "Rich in traditional mountain cultures"
      ]
    },
    "Sudurpashchim": {
      name: "Sudurpashchim Province",
      description: "Sudurpashchim Province is the westernmost province, known for its diverse geography from mountains to plains.",
      funFacts: [
        "Westernmost province of Nepal",
        "Contains the famous Rara Lake",
        "Home to diverse ethnic groups",
        "Known for its traditional festivals"
      ]
    }
  };

  const handleProvinceHover = (provinceName) => {
    setSelectedProvince(provinces[provinceName]);
  };

  const handleProvinceLeave = () => {
    setSelectedProvince(null);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '20px',
      alignItems: 'flex-start',
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Map Container */}
      <div style={{
        flex: '1',
        position: 'relative',
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <svg 
          width="400" 
          height="300" 
          viewBox="0 0 400 300"
          style={{
            border: '2px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}
        >
          {/* Nepal outline */}
          <path
            d="M 50 50 L 350 50 L 350 250 L 50 250 Z"
            fill="none"
            stroke="#333"
            strokeWidth="2"
          />
          
          {/* Province 1 - Eastern region */}
          <path
            d="M 300 80 L 350 80 L 350 150 L 300 150 Z"
            fill="#ff6b6b"
            stroke="#333"
            strokeWidth="1"
            opacity="0.7"
            onMouseEnter={() => handleProvinceHover("Province 1")}
            onMouseLeave={handleProvinceLeave}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Madhesh - Southern region */}
          <path
            d="M 200 200 L 300 200 L 300 250 L 200 250 Z"
            fill="#51cf66"
            stroke="#333"
            strokeWidth="1"
            opacity="0.7"
            onMouseEnter={() => handleProvinceHover("Madhesh")}
            onMouseLeave={handleProvinceLeave}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Bagmati - Central region */}
          <path
            d="M 250 120 L 300 120 L 300 180 L 250 180 Z"
            fill="#339af0"
            stroke="#333"
            strokeWidth="1"
            opacity="0.7"
            onMouseEnter={() => handleProvinceHover("Bagmati")}
            onMouseLeave={handleProvinceLeave}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Gandaki - Central-west region */}
          <path
            d="M 180 100 L 250 100 L 250 160 L 180 160 Z"
            fill="#ffd43b"
            stroke="#333"
            strokeWidth="1"
            opacity="0.7"
            onMouseEnter={() => handleProvinceHover("Gandaki")}
            onMouseLeave={handleProvinceLeave}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Lumbini - Central-south region */}
          <path
            d="M 200 160 L 250 160 L 250 200 L 200 200 Z"
            fill="#cc5de8"
            stroke="#333"
            strokeWidth="1"
            opacity="0.7"
            onMouseEnter={() => handleProvinceHover("Lumbini")}
            onMouseLeave={handleProvinceLeave}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Karnali - Western region */}
          <path
            d="M 100 80 L 180 80 L 180 160 L 100 160 Z"
            fill="#20c997"
            stroke="#333"
            strokeWidth="1"
            opacity="0.7"
            onMouseEnter={() => handleProvinceHover("Karnali")}
            onMouseLeave={handleProvinceLeave}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Sudurpashchim - Far western region */}
          <path
            d="M 50 80 L 100 80 L 100 140 L 50 140 Z"
            fill="#fd7e14"
            stroke="#333"
            strokeWidth="1"
            opacity="0.7"
            onMouseEnter={() => handleProvinceHover("Sudurpashchim")}
            onMouseLeave={handleProvinceLeave}
            style={{ cursor: 'pointer' }}
          />
          
          {/* Province labels */}
          <text x="325" y="115" fontSize="10" fill="#333" textAnchor="middle">Province 1</text>
          <text x="250" y="225" fontSize="10" fill="#333" textAnchor="middle">Madhesh</text>
          <text x="275" y="150" fontSize="10" fill="#333" textAnchor="middle">Bagmati</text>
          <text x="215" y="130" fontSize="10" fill="#333" textAnchor="middle">Gandaki</text>
          <text x="225" y="180" fontSize="10" fill="#333" textAnchor="middle">Lumbini</text>
          <text x="140" y="120" fontSize="10" fill="#333" textAnchor="middle">Karnali</text>
          <text x="75" y="110" fontSize="10" fill="#333" textAnchor="middle">Sudurpashchim</text>
        </svg>

        {/* Map title */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '14px',
          color: '#666',
          fontWeight: '500'
        }}>
          Interactive Nepal Map - Hover over provinces
        </div>
      </div>

      {/* Information Panel */}
      <div style={{
        flex: '1',
        minHeight: '500px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        {selectedProvince ? (
          <div>
            <h3 style={{ 
              color: '#2c3e50', 
              marginBottom: '15px',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              {selectedProvince.name}
            </h3>
            <p style={{ 
              color: '#34495e', 
              lineHeight: '1.6',
              marginBottom: '20px',
              fontSize: '16px'
            }}>
              {selectedProvince.description}
            </p>
            <h4 style={{ 
              color: '#2c3e50', 
              marginBottom: '10px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Fun Facts:
            </h4>
            <ul style={{ 
              color: '#34495e', 
              lineHeight: '1.5',
              paddingLeft: '20px'
            }}>
              {selectedProvince.funFacts.map((fact, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{fact}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h3 style={{ 
              color: '#2c3e50', 
              marginBottom: '15px',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Welcome to Nepal!
            </h3>
            <p style={{ 
              color: '#34495e', 
              lineHeight: '1.6',
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              Hover over or click on a province on the map to learn more about it!
            </p>
            <p style={{ 
              color: '#34495e', 
              lineHeight: '1.6',
              fontSize: '16px'
            }}>
              Each province has its own unique culture, geography, and fascinating facts to discover.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NepalMap;
