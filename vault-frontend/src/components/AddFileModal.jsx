import React, { useState } from "react";
import PasswordModal from "./PasswordModal";

export default function AddFileModal({
  setShowAddFile,
  pickedFile,
  setPickedFile,
  fileUnlockDate,
  setFileUnlockDate,
  addFile,
  pickFileForAdd,
}) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
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
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (password) => {
    setIsProcessing(true);
    try {
      await addFile(password);
      setShowPasswordModal(false);
      setShowAddFile(false);
    } catch (error) {
      console.error('Add file failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white dark:bg-[#0f0f15] rounded-2xl p-6 w-[480px] max-w-[90vw] border border-gray-200 dark:border-gray-700 relative">
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
                  style={{ height: '38px' }}
                />
                <button
                  onClick={pickFileForAdd}
                  className="px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                  style={{ height: '38px' }}
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
                style={{ height: '38px' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 max-w-[400px] mx-auto">
            <button
              onClick={() => setShowAddFile(false)}
              className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
            >
              Add File
            </button>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handlePasswordSubmit}
        title="Add File to Vault"
        isProcessing={isProcessing}
      />
    </>
  );
}
