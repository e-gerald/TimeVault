import React, { useEffect, useState, useRef } from "react";
import Header from "./components/Header";
import VaultInitializer from "./components/VaultInitializer";
import AddFileModal from "./components/AddFileModal";
import FileExistsDialog from "./components/FileExistsDialog";
import Dashboard from "./components/Dashboard";
import "./styles/datetimepicker.css";
import { useTheme } from "./context/ThemeContext";
import { tauriOpen, tauriInvoke } from "./tauri-wrapper";

export default function App() {
  const { dark } = useTheme();

  const [screen, setScreen] = useState("splash");

  // Vault state
  const [vaultPath, setVaultPath] = useState("");
  const [vaultUnlockDate, setVaultUnlockDate] = useState(null);
  const [vaultPassword, setVaultPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [log, setLog] = useState("");
  const [vaultInfo, setVaultInfo] = useState({
    created: "—",
    last_server_time: "—",
  });

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [pickedDir, setPickedDir] = useState("");
  const [pickedFile, setPickedFile] = useState("");
  const [fileUnlockDate, setFileUnlockDate] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // File exists dialog state
  const [showFileExistsDialog, setShowFileExistsDialog] = useState(false);
  const [fileExistsData, setFileExistsData] = useState({
    existingFilename: "",
    newFilename: "",
    fileToAdd: "",
    unlockDate: null,
    password: ""
  });

  // Auto-open modal when file is picked (only when coming from dashboard)
  useEffect(() => {
    if (pickedFile && screen === "dashboard" && !showAddFile) {
      setShowAddFile(true);
    }
  }, [pickedFile, screen, showAddFile]);

  // Refs
  const dropRef = useRef();

  const appendLog = (s) => setLog((prev) => prev + s + "\n");

  // Drag & drop for vault folder (desktop only)
  useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    const handleDrop = (ev) => {
      ev.preventDefault();
      if (ev.dataTransfer?.files?.length) {
        const first = ev.dataTransfer.files[0];
        if (first?.path) {
          setPickedDir(first.path);
        }
      }
    };

    const handleDragOver = (ev) => ev.preventDefault();

    el.addEventListener("drop", handleDrop);
    el.addEventListener("dragover", handleDragOver);

    return () => {
      el.removeEventListener("drop", handleDrop);
      el.removeEventListener("dragover", handleDragOver);
    };
  }, [showCreate]);

  // Vault helpers
  async function refreshVaultStatus(path, silent = false) {
    try {
      if (!silent) {
        appendLog("Verifying saved files...");
      }
      const res = await tauriInvoke("status", { vaultPath: path });
      setFiles(Array.isArray(res) ? res : []);
      if (!silent) {
        appendLog("Files verified successfully");
      }
    } catch (e) {
      console.error("refreshVaultStatus", e);
      appendLog("Error refreshing status: " + (e?.message || e));
    }
  }

  async function refreshVaultInfo(path) {
    try {
      appendLog("Verifying date and time...");
      // Fetch fresh server time from public time API
      const info = await tauriInvoke("refresh_server_time", { vaultDir: path });
      if (info) {
        setVaultInfo({
          created: info.created || "—",
          last_server_time: info.last_server_time || "—",
        });
        appendLog(`Date and time verified from ${info.time_source || 'server'}`);
      }
    } catch (e) {
      console.error("refreshVaultInfo", e);
      appendLog("Error: " + (e?.message || e) + "Please check your internet connection");
      // Fallback to cached time if refresh fails
      try {
        const cachedInfo = await tauriInvoke("vault_info", { vaultDir: path });
        if (cachedInfo) {
          setVaultInfo({
            created: cachedInfo.created || "—",
            last_server_time: cachedInfo.last_server_time || "—",
          });
        }
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
      }
    }
  }

  // Open existing vault
  const openExistingVault = async () => {
    setScreen("splash");
    await new Promise((r) => setTimeout(r, 50));
    try {
      const path = await tauriOpen({ directory: true, multiple: false });
      const chosen = Array.isArray(path) ? path[0] : path;
      if (!chosen) return;

      setVaultPath(chosen);
      setScreen("dashboard");
      await refreshVaultStatus(chosen);
      await refreshVaultInfo(chosen);
      return chosen;
    } catch (e) {
      console.error("openExistingVault", e);
      appendLog("Error opening vault: " + (e?.message || e));
      return null;
    }
  };

  // Directory & file pickers
  const pickCreateDir = async () => {
    try {
      const dir = await tauriOpen({ directory: true, multiple: false });
      const chosen = Array.isArray(dir) ? dir[0] : dir;
      if (chosen) setPickedDir(chosen);
      return chosen || null;
    } catch (e) {
      console.error("pickCreateDir", e);
      appendLog("Error picking directory: " + (e?.message || e));
      return null;
    }
  };

  const pickFileForAdd = async () => {
    try {
      const file = await tauriOpen({ multiple: false });
      const chosen = Array.isArray(file) ? file[0] : file;
      if (chosen) setPickedFile(chosen);
      return chosen || null;
    } catch (e) {
      console.error("pickFileForAdd", e);
      appendLog("Error picking file: " + (e?.message || e));
      return null;
    }
  };

  // ✅ Initialize vault (No unlock date needed - only files have unlock dates)
  const initializeVault = async (vaultDir) => {
    if (!vaultDir) return alert("Choose a directory");
    if (!vaultPassword) return alert("Enter password");

    if (
      vaultDir.includes("src-tauri") ||
      vaultDir.includes("vault-frontend") ||
      vaultDir.includes("node_modules")
    ) {
      alert("Cannot create vault in development directories.");
      return;
    }

    try {
      setIsInitializing(true);
      appendLog("Initializing vault...");

      const vaultPath = vaultDir.replace(/[/\\]$/, "") + (vaultDir.includes("/") ? "/" : "\\") + "MyTimeVault";
      appendLog("Creating vault at: " + vaultPath);

      // Use a far future date as placeholder since backend expects it
      const placeholderUnlock = Math.floor(new Date('2099-12-31').getTime() / 1000);
      await tauriInvoke("init_vault_tauri", {
        vaultDir: vaultPath,
        password: vaultPassword,
        vaultUnlockDate: placeholderUnlock,
      });

      appendLog("Vault initialized at " + vaultPath);
      setVaultPath(vaultPath);
      setShowCreate(false);
      setScreen("dashboard");
      setLog(""); // Clear log when entering dashboard

      await refreshVaultStatus(vaultPath);
      await refreshVaultInfo(vaultPath);
    } catch (e) {
      console.error("initializeVault", e);
      appendLog("Error initializing vault: " + (e?.message || e));
    } finally {
      setIsInitializing(false);
    }
  };

  // Helper function to serialize filename
  const serializeFilename = (filename, n) => {
    const lastDotIndex = filename.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      // No extension
      return `${filename} (${n})`;
    } else {
      const name = filename.substring(0, lastDotIndex);
      const ext = filename.substring(lastDotIndex);
      return `${name} (${n})${ext}`;
    }
  };

  // Verify password only (for add file modal)
  const verifyPasswordForAddFile = async (password, statusCallback) => {
    if (!password) return;

    try {
      appendLog("Verifying vault password...");
      if (statusCallback) statusCallback("Verifying vault password...");
      await tauriInvoke("verify_vault_password", {
        vaultDir: vaultPath,
        password,
      });
      appendLog("Password verified successfully");
      if (statusCallback) statusCallback("Password verified successfully");
      return true;
    } catch (e) {
      console.error("verifyPasswordForAddFile", e);
      const errorMsg = e?.message || e;
      appendLog("Error: " + errorMsg);
      if (statusCallback) statusCallback("Error: " + errorMsg);
      throw e; // Re-throw to handle in UI
    }
  };

  // Add file to vault (called after password verification and modal closes)
  const addFileToVault = async (password, fileToAdd, unlockDate) => {
    if (!vaultPath) return;
    if (!fileToAdd) return;
    if (!unlockDate) return;
    if (!password) return;

    const unlockUnix = Math.floor(unlockDate.getTime() / 1000);

    try {
      // Encrypt and add file
      appendLog("Encrypting and adding file...");
      await tauriInvoke("add_file_tauri", {
        vaultDir: vaultPath,
        filePath: fileToAdd,
        password,
        fileUnlockDate: unlockUnix,
      });

      appendLog(`File added: ${fileToAdd.split(/[\\/]/).pop()}`);
      await refreshVaultStatus(vaultPath, true);
    } catch (e) {
      console.error("addFileToVault", e);
      const errorMsg = e?.message || e;
      
      // Check if this is a file exists error
      if (errorMsg.startsWith("FILE_EXISTS:")) {
        const existingFilename = errorMsg.split(":")[1];
        const newFilename = serializeFilename(existingFilename, 1);
        
        // Show dialog instead of confirm()
        appendLog(`FILE_EXISTS error detected for: ${existingFilename}`);
        setFileExistsData({
          existingFilename,
          newFilename,
          fileToAdd,
          unlockDate,
          password
        });
        setShowFileExistsDialog(true);
        return; // Exit function, dialog will handle the rest
      } else {
        appendLog("Error: " + errorMsg);
      }
    }
  };

  // Handle file exists dialog actions
  const handleFileExistsRename = async () => {
    const { fileToAdd, unlockDate, password } = fileExistsData;
    const unlockUnix = Math.floor(unlockDate.getTime() / 1000);
    
    setShowFileExistsDialog(false);
    
    // Try with serialized filenames
    let attemptNumber = 1;
    let success = false;
    
    while (attemptNumber <= 10 && !success) {
      try {
        const originalFilename = fileToAdd.split(/[\\/]/).pop();
        const serializedFilename = serializeFilename(originalFilename, attemptNumber);
        appendLog(`Trying with serialized name: ${serializedFilename}`);
        
        await tauriInvoke("add_file_with_custom_name", {
          vaultDir: vaultPath,
          filePath: fileToAdd,
          password,
          fileUnlockDate: unlockUnix,
          customFilename: serializedFilename,
        });
        
        appendLog(`File added: ${serializedFilename}`);
        await refreshVaultStatus(vaultPath, true);
        success = true;
      } catch (retryError) {
        const retryMsg = retryError?.message || retryError;
        if (retryMsg.startsWith("FILE_EXISTS:")) {
          attemptNumber++;
        } else {
          // Different error, rethrow
          throw retryError;
        }
      }
    }
    
    if (!success) {
      appendLog("Error: Unable to add file - too many files with similar names exist");
    }
  };

  const handleFileExistsCancel = () => {
    setShowFileExistsDialog(false);
    appendLog("File add cancelled by user");
  };

  // Unlock single vault file
  const unlockSingle = async (file, password, statusCallback) => {
    if (!vaultPath || !password) return;

    try {
      // Step 1: Verify password first
      appendLog("Verifying vault password...");
      if (statusCallback) statusCallback("Verifying vault password...");
      await tauriInvoke("verify_vault_password", {
        vaultDir: vaultPath,
        password,
      });
      appendLog("Password verified successfully");
      if (statusCallback) statusCallback("Password verified successfully");

      // Step 2: Unlock file
      const vaultDir = vaultPath.substring(0, vaultPath.lastIndexOf(/[\\/]/.test(vaultPath) ? (vaultPath.includes('/') ? '/' : '\\') : '/'));
      const unlockedDir = vaultDir + (vaultPath.includes('/') ? '/' : '\\') + 'Unlocked Files';
      
      appendLog(`Unlocking file: ${file.name || file.filename}...`);
      if (statusCallback) statusCallback(`Unlocking file...`);
      const result = await tauriInvoke("unlock_vault_tauri", {
        vaultDir: vaultPath,
        outDir: unlockedDir,
        password,
      });
      appendLog(result);
      appendLog(`File unlocked to: ${unlockedDir}`);
      await refreshVaultStatus(vaultPath);
    } catch (e) {
      console.error("unlockSingle", e);
      const errorMsg = e?.message || e;
      appendLog("Error: " + errorMsg);
      if (statusCallback) statusCallback("Error: " + errorMsg);
      throw e; // Re-throw to handle in UI
    }
  };

  // Unlock all files in vault (saves to "Unlocked Files" folder)
  const unlockAll = async (password, statusCallback) => {
    if (!vaultPath || !password) return;

    try {
      // Step 1: Verify password first
      appendLog("Verifying vault password...");
      if (statusCallback) statusCallback("Verifying vault password...");
      await tauriInvoke("verify_vault_password", {
        vaultDir: vaultPath,
        password,
      });
      appendLog("Password verified successfully");
      if (statusCallback) statusCallback("Password verified successfully");

      // Step 2: Unlock all files
      const vaultDir = vaultPath.substring(0, vaultPath.lastIndexOf(/[\\/]/.test(vaultPath) ? (vaultPath.includes('/') ? '/' : '\\') : '/'));
      const unlockedDir = vaultDir + (vaultPath.includes('/') ? '/' : '\\') + 'Unlocked Files';

      appendLog("Unlocking all eligible files...");
      appendLog(`Output directory: ${unlockedDir}`);
      if (statusCallback) statusCallback("Unlocking all eligible files...");
      
      const result = await tauriInvoke("unlock_vault_tauri", {
        vaultDir: vaultPath,
        outDir: unlockedDir,
        password,
      });
      appendLog(result);
      appendLog("Vault unlock complete!");

      await refreshVaultStatus(vaultPath);
      await refreshVaultInfo(vaultPath);
    } catch (e) {
      console.error("unlockAll", e);
      const errorMsg = e?.message || e;
      appendLog("Error: " + errorMsg);
      if (statusCallback) statusCallback("Error: " + errorMsg);
      throw e; // Re-throw to handle in UI
    }
  };

  // Exit vault and return to splash screen
  const exitVault = () => {
    setVaultPath("");
    setFiles([]);
    setLog("");
    setVaultInfo({ created: "—", last_server_time: "—" });
    setScreen("splash");
  };

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

  return (
    <>
    <div
      className={`min-h-screen transition-colors duration-300 ${
        dark ? "bg-[#0f0f15] text-gray-100" : "bg-[#fafafa] text-gray-900"
      }`}
    >
      <Header visible={screen === "splash" && !showCreate && !showAddFile} />

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {screen === "splash" && (
          <section className="min-h-[75vh] flex flex-col items-center justify-center text-center">
            <div className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-xl">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C9.8 2 8 4 8 6.5V8H7C5.9 8 5 8.9 5 10V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V10C19 8.9 18.1 8 17 8H16V6.5C16 4 14.2 2 12 2Z"
                  stroke="white"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="text-5xl font-bold mt-6">Time Vault</h1>

            <div className="mt-10 flex justify-center gap-8" style={{ gap: '2rem' }}>
              <button
                onClick={openExistingVault}
                className="px-8 py-4 bg-indigo-600 text-white text-lg rounded-lg shadow hover:bg-indigo-700"
              >
                Open Existing Vault
              </button>
              <button
                onClick={() => setShowCreate(true)}
                className="px-8 py-4 bg-indigo-600 text-white text-lg rounded-lg shadow hover:bg-indigo-700"
              >
                Create New Vault
              </button>
            </div>
          </section>
        )}

        {screen === "dashboard" && (
          <Dashboard
            vaultPath={vaultPath}
            vaultInfo={vaultInfo}
            files={files}
            log={log}
            refreshVaultStatus={refreshVaultStatus}
            refreshVaultInfo={refreshVaultInfo}
            setShowAddFile={setShowAddFile}
            unlockAll={unlockAll}
            unlockSingle={unlockSingle}
            onExit={exitVault}
            pickFileForAdd={pickFileForAdd}
          />
        )}
      </main>

      {log && !showCreate && screen !== "dashboard" && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-sm overflow-y-auto max-h-48">
          <pre>{log}</pre>
        </div>
      )}
    </div>

    {/* Modals - Render outside main app div for proper z-index */}
    {showCreate && (
      <VaultInitializer
        setShowCreate={setShowCreate}
        dropRef={dropRef}
        pickedDir={pickedDir}
        setPickedDir={setPickedDir}
        vaultUnlockDate={vaultUnlockDate}
        setVaultUnlockDate={setVaultUnlockDate}
        vaultPassword={vaultPassword}
        setVaultPassword={setVaultPassword}
        initializeVault={initializeVault}
        pickCreateDir={pickCreateDir}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        isInitializing={isInitializing}
        log={log}
      />
    )}

    {showAddFile && (
      <AddFileModal
        setShowAddFile={setShowAddFile}
        pickedFile={pickedFile}
        setPickedFile={setPickedFile}
        fileUnlockDate={fileUnlockDate}
        setFileUnlockDate={setFileUnlockDate}
        verifyPassword={verifyPasswordForAddFile}
        onPasswordVerified={(password) => {
          // After modal closes and password is verified, add the file
          // Save the current file and date before they get cleared
          const fileToAdd = pickedFile;
          const unlockDate = fileUnlockDate;
          // Clear the form
          setPickedFile("");
          setFileUnlockDate(null);
          // Add file in background (FILE_EXISTS dialog will show if needed)
          addFileToVault(password, fileToAdd, unlockDate);
        }}
        pickFileForAdd={pickFileForAdd}
      />
    )}

    {showFileExistsDialog && (
      <FileExistsDialog
        isOpen={showFileExistsDialog}
        existingFilename={fileExistsData.existingFilename}
        newFilename={fileExistsData.newFilename}
        onRename={handleFileExistsRename}
        onCancel={handleFileExistsCancel}
      />
    )}
    </>
  );
}
