import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../context/ThemeContext";

export default function PasswordModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "Enter Password",
  isProcessing = false 
}) {
  const { dark } = useTheme();
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (password && !isProcessing) {
      onSubmit(password);
      setPassword("");
    }
  };

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000000,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        className="w-96 max-w-[90vw] relative"
        style={{
          zIndex: 1000001,
          backgroundColor: dark ? '#0f0f15' : '#ffffff',
          padding: '2rem',
          borderRadius: '20px',
          border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
          boxShadow: dark 
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
            : '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(8px)'
        }}
      >

        <button
          onClick={handleClose}
          disabled={isProcessing}
          className="absolute disabled:opacity-50 text-3xl font-light leading-none"
          style={{ top: '1rem', right: '1rem', left: 'auto', color: '#ef4444' }}
          onMouseEnter={(e) => e.target.style.color = '#dc2626'}
          onMouseLeave={(e) => e.target.style.color = '#ef4444'}
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-center dark:text-gray-100" style={{ marginBottom: '1.5rem' }}>
          {title}
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter vault password"
                className="w-full text-sm dark:text-gray-100 px-4"
                style={{ 
                  height: '44px',
                  borderRadius: '12px',
                  border: `1px solid ${dark ? '#4b5563' : '#d1d5db'}`,
                  backgroundColor: dark ? '#374151' : '#ffffff',
                  transition: 'all 0.2s ease-in-out',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = dark ? '#6b7280' : '#9ca3af';
                  e.target.style.boxShadow = dark 
                    ? '0 0 0 3px rgba(107, 114, 128, 0.1)' 
                    : '0 0 0 3px rgba(156, 163, 175, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = dark ? '#4b5563' : '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
                autoComplete="current-password"
                disabled={isProcessing}
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: '1.5rem' }}>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-6 py-2 text-sm disabled:opacity-50 dark:text-gray-200"
              style={{
                borderRadius: '10px',
                border: `1px solid ${dark ? '#4b5563' : '#d1d5db'}`,
                backgroundColor: dark ? '#374151' : '#ffffff',
                color: dark ? '#e5e7eb' : '#374151',
                transition: 'all 0.2s ease-in-out',
                cursor: isProcessing ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.target.style.backgroundColor = dark ? '#4b5563' : '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = dark ? '#374151' : '#ffffff';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !password}
              className="px-6 py-2 text-sm disabled:opacity-50"
              style={{
                borderRadius: '10px',
                backgroundColor: isProcessing || !password ? '#9ca3af' : '#4f46e5',
                color: '#ffffff',
                border: 'none',
                transition: 'all 0.2s ease-in-out',
                cursor: isProcessing || !password ? 'not-allowed' : 'pointer',
                boxShadow: isProcessing || !password ? 'none' : '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isProcessing && password) {
                  e.target.style.backgroundColor = '#3730a3';
                  e.target.style.boxShadow = '0 6px 20px 0 rgba(79, 70, 229, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = isProcessing || !password ? '#9ca3af' : '#4f46e5';
                e.target.style.boxShadow = isProcessing || !password ? 'none' : '0 4px 14px 0 rgba(79, 70, 229, 0.3)';
              }}
            >
              {isProcessing ? "Verifying..." : "Submit"}
            </button>
          </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
