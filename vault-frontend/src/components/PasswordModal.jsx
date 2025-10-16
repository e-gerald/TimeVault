import React, { useState } from "react";

export default function PasswordModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title = "Enter Password",
  isProcessing = false 
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (password) {
      onSubmit(password);
      setPassword("");
      setShowPassword(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setShowPassword(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-[#0f0f15] rounded-2xl p-6 w-96 max-w-[90vw] border border-gray-200 dark:border-gray-700 relative">
        {/* Close button */}
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

        <h2 className="text-xl font-semibold text-center mb-6 dark:text-gray-100">
          {title}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 dark:text-gray-200">
              Vault Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter vault password"
                className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 px-3 pr-10 text-sm"
                style={{ height: '38px' }}
                autoComplete="current-password"
                disabled={isProcessing}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={isProcessing}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm disabled:opacity-50 dark:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !password}
              className="px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

