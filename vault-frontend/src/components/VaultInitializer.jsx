import React from "react";

export default function VaultInitializer({
  setShowCreate,
  dropRef,
  pickedDir,
  setPickedDir,
  vaultPassword,
  setVaultPassword,
  initializeVault,
  showPassword,
  setShowPassword,
  pickCreateDir,
  isInitializing,
  log,
}) {
  const handleCreate = async () => {
    if (typeof initializeVault === "function") {
      await initializeVault(pickedDir);
    } else {
      setShowCreate(false);
    }
  };

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      ref={dropRef}
    >
      <div className="modal-window space-y-4 dark:bg-[#0f0f15] dark:text-gray-100 bg-white rounded-2xl p-6 w-[480px] max-w-[94vw] border border-gray-200 dark:border-gray-700 relative" style={{ direction: 'ltr' }}>
        <button
          onClick={() => setShowCreate(false)}
          disabled={isInitializing}
          className="absolute disabled:opacity-50 text-3xl font-light leading-none"
          style={{ top: '1rem', right: '1rem', left: 'auto', color: '#ef4444' }}
          onMouseEnter={(e) => e.target.style.color = '#dc2626'}
          onMouseLeave={(e) => e.target.style.color = '#ef4444'}
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold text-center mb-3 dark:text-gray-100">
          Create New Vault
        </h2>

        <div className="space-y-2 max-w-[400px] mx-auto" style={{ opacity: isInitializing ? 0.6 : 1 }}>
          <label className="block text-sm">Directory</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pickedDir}
              readOnly
              placeholder="Select parent folder - Vault will be created inside"
              className="flex-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 text-sm"
              style={{ height: '25px', lineHeight: '20px', paddingTop: 0, paddingBottom: 0 }}
              disabled={isInitializing}
            />
            <button
              onClick={pickCreateDir}
              className="px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-60"
              style={{ height: '25px' }}
              disabled={isInitializing}
            >
              Browse
            </button>
          </div>
        </div>

        <div className="space-y-2 max-w-[400px] mx-auto" style={{ opacity: isInitializing ? 0.6 : 1 }}>
          <label className="block text-sm dark:text-gray-200">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={vaultPassword}
            onChange={(e) => setVaultPassword(e.target.value)}
            placeholder="Create vault password"
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 px-3 text-sm"
            style={{ height: '25px', lineHeight: '25px', paddingTop: 0, paddingBottom: 0 }}
            autoComplete="new-password"
            disabled={isInitializing}
          />
        </div>

        {log && (
          <div className="max-w-[400px] mx-auto">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
              <pre className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                {log}
              </pre>
            </div>
          </div>
        )}

        <div className="flex justify-end max-w-[400px] mx-auto" style={{ marginTop: '0.5rem' }}>
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-60"
            disabled={isInitializing}
          >
            {isInitializing ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
