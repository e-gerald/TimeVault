import React from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../context/ThemeContext";

export default function FileExistsDialog({
  isOpen,
  existingFilename,
  newFilename,
  onRename,
  onCancel,
}) {
  if (!isOpen) return null;
  const { dark } = useTheme();

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
        className="max-w-[90vw] w-[420px] relative"
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
        <h2 className="text-xl font-semibold text-center" style={{ color: dark ? '#e5e7eb' : '#111827', marginBottom: '1rem' }}>
          File Already Exists
        </h2>

        <div>
          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: dark ? '#d1d5db' : '#374151' }}>
              A file named <span className="font-semibold">"{existingFilename}"</span> already exists in the vault.
            </p>
            <p className="text-sm" style={{ color: dark ? '#9ca3af' : '#6b7280' }}>
              Click <span className="font-semibold">Rename</span> to keep both files (will rename new file to <span className="font-semibold">"{newFilename}"</span>), or <span className="font-semibold">Cancel</span> to stop adding this file.
            </p>
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: '1.25rem' }}>
            <button
              onClick={onCancel}
              className="text-sm disabled:opacity-50"
              style={{
                borderRadius: '10px',
                border: `1px solid ${dark ? '#4b5563' : '#d1d5db'}`,
                backgroundColor: dark ? '#374151' : '#ffffff',
                color: dark ? '#e5e7eb' : '#374151',
                padding: '0.5rem 0.9rem',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = dark ? '#4b5563' : '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = dark ? '#374151' : '#ffffff';
              }}
            >
              Cancel
            </button>
            <button
              onClick={onRename}
              className="text-sm disabled:opacity-50"
              style={{
                borderRadius: '10px',
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                padding: '0.5rem 0.9rem',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3730a3';
                e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(79, 70, 229, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4f46e5';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(79, 70, 229, 0.3)';
              }}
            >
              Rename
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
