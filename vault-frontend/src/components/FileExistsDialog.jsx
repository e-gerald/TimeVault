import React from "react";
import { createPortal } from "react-dom";

export default function FileExistsDialog({
  isOpen,
  existingFilename,
  newFilename,
  onRename,
  onCancel,
}) {
  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: '#000000',
        opacity: 0.6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className="bg-white dark:bg-[#0f0f15] rounded-2xl p-6 w-96 max-w-[90vw] border border-gray-200 dark:border-gray-700 relative" style={{ zIndex: 1000000 }}>
        <h2 className="text-xl font-semibold text-center mb-6 dark:text-gray-100">
          File Already Exists
        </h2>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              A file named <span className="font-semibold">"{existingFilename}"</span> already exists in the vault.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click <span className="font-semibold">Rename</span> to keep both files (will rename new file to <span className="font-semibold">"{newFilename}"</span>), or <span className="font-semibold">Cancel</span> to stop adding this file.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={onRename}
              className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
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
