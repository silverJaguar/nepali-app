import React from 'react';

const MinimalButton = ({ 
  onClick, 
  disabled = false, 
  children, 
  size = 'medium',
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-11 h-11',
    large: 'w-12 h-12'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`minimal-btn ${className}`}
      style={{
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid #222',
        borderRadius: '8px',
        background: 'none',
        boxShadow: 'none',
        outline: 'none',
        padding: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s, background 0.15s, border 0.15s, color 0.15s',
        minWidth: 'fit-content',
        minHeight: 'fit-content',
        width: 'auto',
        height: 'auto',
        ...props.style
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default MinimalButton;
