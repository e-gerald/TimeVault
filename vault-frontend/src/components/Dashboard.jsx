import React, { useState, useEffect, useRef } from "react";
import PasswordModal from "./PasswordModal";

export default function Dashboard({ 
  vaultPath, 
  vaultInfo, 
  files, 
  log, 
  refreshVaultStatus, 
  refreshVaultInfo, 
  setShowAddFile, 
  unlockAll, 
  unlockSingle,
  onExit 
}) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null); // 'unlock-file' or 'unlock-vault'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wiggling, setWiggling] = useState(null);
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom when log updates
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);

  const formatDate = (v) => {
    if (v === null || v === undefined || v === "—") return "—";
    if (typeof v === "number") return new Date(v * 1000).toLocaleString();
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (/^\d+$/.test(trimmed)) {
        const n = Number(trimmed);
        const dateMs = trimmed.length >= 13 ? n : n * 1000;
        return new Date(dateMs).toLocaleString();
      }
      const d = new Date(trimmed);
      return isNaN(d.getTime()) ? v : d.toLocaleString();
    }
    try {
      const d = new Date(v);
      return isNaN(d.getTime()) ? "—" : d.toLocaleString();
    } catch {
      return "—";
    }
  };

  const handleRefreshStatus = async () => {
    if (vaultPath) {
      await refreshVaultStatus(vaultPath);
      await refreshVaultInfo(vaultPath);
    }
  };

  const handleLockedClick = (fileIndex) => {
    setWiggling(fileIndex);
    setTimeout(() => setWiggling(null), 500);
  };

  const handleUnlockFile = (file) => {
    setSelectedFile(file);
    setPasswordAction('unlock-file');
    setShowPasswordModal(true);
  };

  const handleUnlockVault = () => {
    setPasswordAction('unlock-vault');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (password) => {
    setIsProcessing(true);
    
    try {
      if (passwordAction === 'unlock-file') {
        await unlockSingle(selectedFile, password);
      } else if (passwordAction === 'unlock-vault') {
        await unlockAll(password);
      }
      setShowPasswordModal(false);
      setSelectedFile(null);
      setPasswordAction(null);
    } catch (error) {
      console.error('Password action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f15]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a24] border-b border-gray-200 dark:border-gray-700">
        <div className="px-8 py-5 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Vault: {vaultPath}
              </h1>
            </div>
            
            {/* Exit button */}
            <div className="flex items-center">
              <button
                onClick={onExit}
                className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-md text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Exit Vault"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit
              </button>
            </div>
          </div>
          
          {/* Refresh Status Button - on new line inside header */}
          <div className="mt-4">
            <button
              onClick={handleRefreshStatus}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6 max-w-7xl mx-auto" style={{ paddingBottom: log ? '12rem' : '1.5rem' }}>
        {/* Files Table */}
        <div className="bg-white dark:bg-[#1a1a24] shadow rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unlock Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1a1a24] divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(files) && files.length > 0 ? (
                  files.map((file, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {file.name || file.filename || `File ${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(file.unlock_time || file.unlockDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {file.unlocked ? (
                          <button
                            onClick={() => handleUnlockFile(file)}
                            className="inline-flex items-center px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                          >
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            </svg>
                            Open
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLockedClick(index)}
                            className={`inline-flex items-center px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium cursor-not-allowed transition-all ${
                              wiggling === index ? 'animate-wiggle' : ''
                            }`}
                          >
                            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Locked
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No files in vault
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-10 max-w-2xl">
          <button
            onClick={() => setShowAddFile(true)}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-xl border-2 border-blue-700 hover:border-blue-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-base mr-1.5 font-bold">+</span>
            Add New File
          </button>
          <button
            onClick={handleUnlockVault}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-xl border-2 border-green-700 hover:border-green-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-xs mr-1.5">🔓</span>
            Unlock Vault
          </button>
        </div>

      </div>

      {/* Footer - Activity Log */}
      {log && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a1a24] border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-8 py-3 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Activity Log
              </h3>
            </div>
            <div ref={logContainerRef} className="overflow-y-auto" style={{ maxHeight: '7.5rem' }}>
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                {log}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSelectedFile(null);
          setPasswordAction(null);
        }}
        onSubmit={handlePasswordSubmit}
        title={passwordAction === 'unlock-file' ? 'Unlock File' : 'Unlock Vault'}
        isProcessing={isProcessing}
      />

      {/* Wiggle Animation */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px) rotate(-2deg); }
          75% { transform: translateX(4px) rotate(2deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
