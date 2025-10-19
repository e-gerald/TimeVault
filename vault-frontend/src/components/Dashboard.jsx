import React, { useState, useEffect, useRef } from "react";

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
  onExit,
  pickFileForAdd 
}) {
  const [password, setPassword] = useState("");
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null); // 'unlock-file' or 'unlock-vault'
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wiggling, setWiggling] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const logContainerRef = useRef(null);

  // Helper to check if file is unlocked based on server time
  const isFileUnlocked = (file) => {
    const serverTime = vaultInfo?.last_server_time;
    const fileUnlockDate = file.file_unlock_date || file.unlock_time || file.unlockDate;
    
    console.log("Checking unlock status:", {
      serverTime,
      fileUnlockDate,
      fileName: file.filename || file.name,
      vaultInfo
    });
    
    if (!serverTime || !fileUnlockDate) {
      console.log("Missing data - serverTime or fileUnlockDate is null");
      return false;
    }
    
    // Parse server time (could be unix timestamp or ISO string)
    const serverUnix = typeof serverTime === 'number' ? serverTime : 
                       typeof serverTime === 'string' && /^\d+$/.test(serverTime.trim()) ? 
                       parseInt(serverTime.trim()) : 
                       Math.floor(new Date(serverTime).getTime() / 1000);
    
    // Parse file unlock date (unix timestamp)
    const fileUnix = typeof fileUnlockDate === 'number' ? fileUnlockDate : parseInt(fileUnlockDate);
    
    console.log("Comparison:", {
      serverUnix,
      fileUnix,
      serverDate: new Date(serverUnix * 1000).toLocaleString(),
      fileDate: new Date(fileUnix * 1000).toLocaleString(),
      isUnlocked: serverUnix >= fileUnix
    });
    
    return serverUnix >= fileUnix;
  };

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
    setShowPasswordField(true);
  };

  const handleUnlockVault = () => {
    setPasswordAction('unlock-vault');
    setShowPasswordField(true);
  };

  const handleCancelPassword = () => {
    setPassword("");
    setShowPasswordField(false);
    setSelectedFile(null);
    setPasswordAction(null);
    setStatusMessage("");
  };

  const handleConfirmPassword = async () => {
    if (!password) {
      alert("Please enter vault password");
      return;
    }
    setIsProcessing(true);
    setStatusMessage("Verifying vault password...");
    
    try {
      if (passwordAction === 'unlock-file') {
        await unlockSingle(selectedFile, password, (status) => {
          setStatusMessage(status);
        });
      } else if (passwordAction === 'unlock-vault') {
        await unlockAll(password, (status) => {
          setStatusMessage(status);
        });
      }
      setStatusMessage("Success!");
      setTimeout(() => {
        setPassword("");
        setShowPasswordField(false);
        setSelectedFile(null);
        setPasswordAction(null);
        setStatusMessage("");
      }, 1000);
    } catch (error) {
      console.error('Password action failed:', error);
      setStatusMessage("");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f15]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a24] border-b border-gray-200 dark:border-gray-700">
        <div className="px-12 py-5 max-w-7xl mx-auto" style={{ marginLeft: '10px', marginRight: '10px' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100" title={vaultPath}>
                Vault: {vaultPath.split(/[\\/]/).pop()}
              </h1>
            </div>
            
            {/* Exit button */}
            <div className="flex items-center">
              <button
                onClick={onExit}
                className="inline-flex items-center px-8 py-4 border-2 rounded-lg text-base font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ 
                  borderColor: '#ef4444', 
                  color: '#dc2626', 
                  backgroundColor: '#fef2f2',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => { 
                  e.target.style.backgroundColor = '#fee2e2'; 
                  e.target.style.color = '#b91c1c'; 
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => { 
                  e.target.style.backgroundColor = '#fef2f2'; 
                  e.target.style.color = '#dc2626'; 
                  e.target.style.transform = 'translateY(0)';
                }}
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
            className="inline-flex items-center px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            style={{
              borderColor: '#3b82f6',
              color: '#1d4ed8',
              backgroundColor: '#dbeafe',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#bfdbfe';
              e.target.style.color = '#1e40af';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dbeafe';
              e.target.style.color = '#1d4ed8';
              e.target.style.transform = 'translateY(0)';
            }}
            >
              <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6 max-w-7xl mx-auto px-12" style={{ paddingBottom: log ? '8rem' : '1.5rem', marginLeft: '10px', marginRight: '10px' }}>
        {/* Files Table */}
        <div className="flex justify-center mb-6">
          <div className="bg-white dark:bg-[#1a1a24] shadow rounded-lg w-full max-w-4xl">
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '340px', scrollbarWidth: 'thin' }}>
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Unlock Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1a1a24] divide-y divide-gray-200 dark:divide-gray-700">
                {Array.isArray(files) && files.length > 0 ? (
                  [...files].sort((a, b) => {
                    // Sort by creation time if available, otherwise by unlock date, newest first
                    const aTime = a.created_at || a.created || a.file_unlock_date || a.unlock_time || a.unlockDate || 0;
                    const bTime = b.created_at || b.created || b.file_unlock_date || b.unlock_time || b.unlockDate || 0;
                    return bTime - aTime; // Descending order (newest first)
                  }).map((file, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 text-center">
                        {file.name || file.filename || `File ${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                        {formatDate(file.file_unlock_date || file.unlock_time || file.unlockDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        {isFileUnlocked(file) ? (
                          <button
                            onClick={() => handleUnlockFile(file)}
                            className="inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                            style={{ backgroundColor: '#10b981', borderRadius: '8px', color: '#ffffff' }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = '#059669'; e.target.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = '#10b981'; e.target.style.transform = 'translateY(0)'; }}
                          >
                            <span className="text-lg mr-2">🔓</span>
                            Open
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLockedClick(index)}
                            className={`inline-flex items-center px-6 py-3 rounded-lg text-sm font-semibold cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg ${
                              wiggling === index ? 'animate-wiggle' : ''
                            }`}
                            style={{ backgroundColor: '#ef4444', borderRadius: '8px', color: '#ffffff' }}
                            onMouseEnter={(e) => { e.target.style.backgroundColor = '#dc2626'; e.target.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={(e) => { e.target.style.backgroundColor = '#ef4444'; e.target.style.transform = 'translateY(0)'; }}
                          >
                            <span className="text-lg mr-2">🔒</span>
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
        </div>

        {/* Action Buttons - Right under table */}
        <div className="flex justify-center mb-6" style={{ marginTop: '40px' }}>
          <div className="flex items-center justify-center gap-64 py-12 px-12 w-full">
            {!showPasswordField ? (
              <>
                <button
                  onClick={async () => {
                    if (pickFileForAdd) {
                      await pickFileForAdd();
                    }
                  }}
                  className="inline-flex items-center justify-center px-20 py-10 rounded-xl text-3xl font-bold shadow-4xl hover:shadow-5xl border-6 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: '#3b82f6', borderColor: '#2563eb', borderRadius: '12px', borderWidth: '6px', color: '#ffffff' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#2563eb'; e.target.style.borderColor = '#1d4ed8'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = '#3b82f6'; e.target.style.borderColor = '#2563eb'; }}
                >
                  <span className="text-base mr-1.5 font-bold">+</span>
                  Add New File
                </button>
                <button
                  onClick={handleUnlockVault}
                  className="inline-flex items-center justify-center px-20 py-10 rounded-xl text-3xl font-bold shadow-4xl hover:shadow-5xl border-6 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: '#10b981', borderColor: '#059669', borderRadius: '12px', borderWidth: '6px', color: '#ffffff' }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = '#059669'; e.target.style.borderColor = '#047857'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = '#10b981'; e.target.style.borderColor = '#059669'; }}
                >
                  <span className="text-xs mr-1.5">🔓</span>
                  Unlock Vault
                </button>
              </>
            ) : (
              <div className="w-full max-w-2xl mx-auto space-y-3">
                <div className="flex items-end gap-3 justify-center">
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-200">
                      {passwordAction === 'unlock-file' 
                        ? `Enter Vault Password to unlock ${selectedFile?.filename || selectedFile?.name || 'file'}` 
                        : 'Unlock All Available Files'}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleConfirmPassword()}
                      placeholder="Enter vault password"
                      className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 px-3 text-sm"
                      style={{ height: '32px', lineHeight: '32px', paddingTop: 0, paddingBottom: 0, width: '300px' }}
                      autoComplete="current-password"
                      disabled={isProcessing}
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3" style={{ marginLeft: '4px' }}>
                    <button
                      onClick={handleCancelPassword}
                      disabled={isProcessing}
                      className="px-6 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold dark:text-gray-200 disabled:opacity-50 transition-all duration-200"
                      style={{ height: '32px', lineHeight: '32px' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmPassword}
                      disabled={isProcessing}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
                      style={{ height: '32px', lineHeight: '32px' }}
                    >
                      {isProcessing ? "Processing..." : "Confirm"}
                    </button>
                  </div>
                </div>
                {/* Status Message - Shows current operation status */}
                {statusMessage && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-700 dark:text-gray-300">
                      {isProcessing && statusMessage !== "Success!" && !statusMessage.startsWith("Error") && (
                        <span className="inline-block animate-pulse">⋯</span>
                      )}
                      {statusMessage === "Success!" && (
                        <span className="text-green-600 dark:text-green-400">✓</span>
                      )}
                      {statusMessage.startsWith("Error") && (
                        <span className="text-red-600 dark:text-red-400">✗</span>
                      )}
                      <span className={
                        statusMessage === "Success!" 
                          ? "text-green-600 dark:text-green-400" 
                          : statusMessage.startsWith("Error")
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }>{statusMessage}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Activity Log - Separate container */}
      {log && !showPasswordField && (
        <div className="fixed left-4 right-4 bg-white dark:bg-[#1a1a24] shadow-lg rounded-lg overflow-hidden" style={{ zIndex: 5, bottom: '60px', marginLeft: '10px', marginRight: '10px' }}>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Activity Log
              </h3>
            </div>
            <div ref={logContainerRef} className="overflow-y-auto" style={{ maxHeight: '7.5rem' }}>
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono break-all overflow-x-auto">
                {log}
              </pre>
            </div>
          </div>
        </div>
      )}

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
