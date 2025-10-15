import React from "react";

export default function FileList({ files = [], unlockSingle }) {
  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No files</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by adding a new file.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y" style={{borderColor: '#e5e7eb'}}>
      {files.map((f, i) => {
        const isLocked = f.locked || f.locked === true;
        const unlockTime = f.unlock_time || f.unlock;
        
        return (
          <li key={i}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{backgroundColor: '#f3f4f6'}}>
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: '#6b7280'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium truncate" style={{color: '#111827'}}>
                        {f.name || f.file_name || "unknown"}
                      </p>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm" style={{color: '#6b7280'}}>
                        Unlock Time: {unlockTime ? new Date(unlockTime * 1000).toLocaleString() : "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  {isLocked ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{backgroundColor: '#fef2f2', color: '#991b1b'}}>
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Locked
                    </span>
                  ) : (
                    <button
                      onClick={() => unlockSingle(f.out_dir || f.path || ".")}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white"
                      style={{
                        backgroundColor: '#059669',
                        borderRadius: '0.375rem'
                      }}
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      Open
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
