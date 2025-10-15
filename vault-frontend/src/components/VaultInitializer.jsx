import React from "react";

export default function VaultInitializer({
  setShowCreate,
  dropRef,
  pickedDir,
  setPickedDir,
  vaultUnlockDate,
  setVaultUnlockDate,
  vaultPassword,
  setVaultPassword,
  initializeVault,
  showPassword,
  setShowPassword,
  // from parent
  pickCreateDir,
  isInitializing,
}) {
  // ✅ Fixed handleCreate to pass directory path as string
  const handleCreate = async () => {
    if (typeof initializeVault === "function") {
      await initializeVault(pickedDir);
    } else {
      setShowCreate(false);
    }
  };


  return (
    <div
      className="modal-backdrop fixed inset-0 flex items-center justify-center z-[9999]"
      ref={dropRef}
    >
      <div className="modal-window space-y-4 dark:bg-[#0f0f15] dark:text-gray-100 bg-white rounded-2xl p-6 w-[480px] max-w-[94vw] border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-center mb-3">
          Create New Vault
        </h2>

        {isInitializing && (
          <div className="flex items-center gap-3 text-sm px-3 py-2 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
            <span className="inline-block h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium">Creating vault, please wait…</span>
          </div>
        )}

        {/* Directory */}
        <div className="space-y-2 max-w-[400px] mx-auto" style={{ opacity: isInitializing ? 0.6 : 1 }}>
          <label className="block text-sm">Directory</label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={pickedDir}
              readOnly
              placeholder="Select parent folder - vault will be created inside"
              className="flex-1 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-sm"
              disabled={isInitializing}
            />
            <button
              onClick={pickCreateDir}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-60"
              disabled={isInitializing}
            >
              Browse
            </button>
          </div>
        </div>

        {/* Unlock Date */}
        <div className="space-y-2 max-w-[400px] mx-auto" style={{ opacity: isInitializing ? 0.6 : 1 }}>
          <label className="block text-sm">Unlock Date and Time</label>
          <input
            type="datetime-local"
            value={
              vaultUnlockDate
                ? new Date(vaultUnlockDate).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) => setVaultUnlockDate(new Date(e.target.value))}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-sm"
            disabled={isInitializing}
          />
        </div>

        {/* Password */}
        <div className="space-y-2 max-w-[400px] mx-auto" style={{ opacity: isInitializing ? 0.6 : 1 }}>
          <label className="block text-sm">Password</label>
          <div className="relative w-full h-9">
            <input
              type={showPassword ? "text" : "password"}
              value={vaultPassword}
              onChange={(e) => setVaultPassword(e.target.value)}
              placeholder="Enter vault password"
              className="w-full rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 pr-9 h-full text-sm"
              autoComplete="new-password"
              disabled={isInitializing}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setShowCreate(false)}
            className="px-4 py-1.5 border rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-sm disabled:opacity-60"
            disabled={isInitializing}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-60"
            disabled={isInitializing}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
