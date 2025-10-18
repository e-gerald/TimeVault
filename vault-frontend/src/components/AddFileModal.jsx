import React, { useState } from "react";
import { createPortal } from "react-dom";

export default function AddFileModal({
  setShowAddFile,
  pickedFile,
  setPickedFile,
  fileUnlockDate,
  setFileUnlockDate,
  addFile,
  pickFileForAdd,
}) {
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdd = () => {
    if (!pickedFile) {
      alert("Please select a file");
      return;
    }
    if (!fileUnlockDate) {
      alert("Please set unlock date");
      return;
    }
    setShowPasswordField(true);
  };

  const handleConfirm = async () => {
    if (!password) {
      alert("Please enter vault password");
      return;
    }
    setIsProcessing(true);
    try {
      await addFile(password);
      setPassword("");
      setShowAddFile(false);
    } catch (error) {
      console.error('Add file failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const modalContent = (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div 
          className="bg-white dark:bg-[#0f0f15] rounded-2xl p-6 w-[480px] max-w-[90vw] border border-gray-200 dark:border-gray-700 relative"
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            minHeight: '200px',
            position: 'relative',
            zIndex: 100000
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowAddFile(false)}
            className="absolute disabled:opacity-50 text-3xl font-light leading-none"
            style={{ top: '1rem', right: '1rem', left: 'auto', color: '#ef4444' }}
            onMouseEnter={(e) => e.target.style.color = '#dc2626'}
            onMouseLeave={(e) => e.target.style.color = '#ef4444'}
            aria-label="Close"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold text-center mb-6 dark:text-gray-100">
            Add New File
          </h2>

          <div className="space-y-4 max-w-[400px] mx-auto">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                File
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pickedFile}
                  readOnly
                  placeholder="Select a file to add"
                  className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 px-3 text-sm"
                  style={{ height: '25px' }}
                  disabled={showPasswordField}
                />
                <button
                  onClick={pickFileForAdd}
                  className="px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-60"
                  style={{ height: '25px' }}
                  disabled={showPasswordField}
                >
                  Browse
                </button>
              </div>
            </div>

            {/* Unlock Date */}
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                Unlock Date and Time
              </label>
              <input
                type="datetime-local"
                value={
                  fileUnlockDate
                    ? new Date(fileUnlockDate).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => setFileUnlockDate(new Date(e.target.value))}
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 px-3 text-sm"
                style={{ height: '25px' }}
                disabled={showPasswordField}
              />
            </div>

            {/* Password Field - Shows after Add File is clicked */}
            {showPasswordField && (
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Vault Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder="Enter vault password"
                  className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 px-3 text-sm"
                  style={{ height: '25px', lineHeight: '25px', paddingTop: 0, paddingBottom: 0 }}
                  autoComplete="current-password"
                  disabled={isProcessing}
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 max-w-[400px] mx-auto">
            <button
              onClick={() => setShowAddFile(false)}
              className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm dark:text-gray-200"
              disabled={isProcessing}
            >
              Cancel
            </button>
            {!showPasswordField ? (
              <button
                onClick={handleAdd}
                className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
              >
                Add File
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-60"
                disabled={isProcessing}
              >
                {isProcessing ? "Adding..." : "Confirm"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
