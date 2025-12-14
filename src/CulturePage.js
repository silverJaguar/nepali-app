import React from "react";
import cultureData from "./culture.js";
import ImageCarousel from "./ImageCarousel";
import NepalMap from "./nepalimap";
import { FiArrowLeft } from "react-icons/fi";
import MinimalButton from "./components/MinimalButton";

const CulturePage = ({ category, onBack }) => {
  const data = cultureData[category];

  if (!data) return <p>Category not found.</p>;

  console.log('CulturePage images:', data.images);

  return (
    <>
      {/* Category name above the card */}
      <div style={{ textAlign: 'center', marginBottom: '0.5em' }}>
        <span style={{ fontSize: '1.1em', color: '#b48bbd', fontWeight: 500 }}>{data.title}</span>
      </div>
      <div
        className="p-4 border rounded-lg shadow culture-page-card"
        style={{
          minHeight: data.type === 'map' ? '650px' : '340px',
          width: data.type === 'map' ? '1200px' : '420px',
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: window.innerWidth <= 768 ? '12px' : '16px',
          boxSizing: 'border-box'
        }}
      >
        {/* Minimalist back button in top-left inside card */}
        <MinimalButton
          onClick={onBack}
          aria-label="Back"
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            zIndex: 2,
          }}
        >
          <FiArrowLeft size={28} />
        </MinimalButton>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '0 8px' }}>
          <h2 className="font-bold text-3xl culture-page-title" style={{ textAlign: 'center', margin: '0.7em 0 0.3em 0', color: '#db7093' }}>{data.title}</h2>
          <p className="culture-page-description" style={{ textAlign: 'center', margin: '0.5em 0 1.2em 0', fontSize: '1.13em', color: '#444' }}>{data.description}</p>
          {data.type === 'map' ? (
            <div style={{ width: '100%', margin: '0.5em 0 0 0' }}>
              <NepalMap />
            </div>
          ) : (
            <div style={{ width: '100%', margin: '0.5em 0 0 0' }}>
              <ImageCarousel images={data.images} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CulturePage;
