// ImageCarousel.js
import React, { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import MinimalButton from "./components/MinimalButton";

const ImageCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false); // Reset error state when image changes
  }, [currentIndex, images]);

  const prev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const next = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const imgSrc =
    images[currentIndex].startsWith('http')
      ? images[currentIndex]
      : images[currentIndex].startsWith('/')
        ? process.env.PUBLIC_URL + images[currentIndex]
        : images[currentIndex];

  console.log('ImageCarousel imgSrc:', imgSrc);

  return (
    <div className="carousel-container">
      <div className="carousel-image" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: '180px', marginBottom: '0.5em' }}>
        {imgError ? (
          <div style={{ color: '#888', textAlign: 'center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Image not available
          </div>
        ) : (
          <img
            src={imgSrc}
            alt={
              images[currentIndex].startsWith('/')
                ? `Culture image ${currentIndex + 1}`
                : images[currentIndex].split('?text=')[1] || `Image ${currentIndex + 1}`
            }
            className="rounded"
            style={{
              maxWidth: '320px',
              maxHeight: '180px',
              width: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className="carousel-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2.5rem', marginTop: '1.2rem' }}>
        <MinimalButton
          onClick={prev}
          aria-label="Previous image"
        >
          <FiChevronLeft size={28} />
        </MinimalButton>
        <MinimalButton
          onClick={next}
          aria-label="Next image"
        >
          <FiChevronRight size={28} />
        </MinimalButton>
      </div>
    </div>
  );
};

export default ImageCarousel;
