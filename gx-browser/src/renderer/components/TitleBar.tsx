import React from 'react';
import './TitleBar.css';

/**
 * TitleBar - Custom window title bar with controls
 * Provides minimize, maximize, and close buttons
 */
function TitleBar() {
  const handleMinimize = () => {
    window.electronAPI.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI.windowMaximize();
  };

  const handleClose = () => {
    window.electronAPI.windowClose();
  };

  return (
    <div className="title-bar">
      <div className="title-bar-drag-region">
        <div className="title-bar-title">
          <span className="gradient-text">GX Browser</span>
        </div>
      </div>

      <div className="title-bar-controls">
        <button
          className="title-bar-button minimize"
          onClick={handleMinimize}
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="0" y="5" width="12" height="2" fill="currentColor" />
          </svg>
        </button>

        <button
          className="title-bar-button maximize"
          onClick={handleMaximize}
          title="Maximize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>

        <button
          className="title-bar-button close"
          onClick={handleClose}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M1 1 L11 11 M11 1 L1 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
