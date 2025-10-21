import React, { useEffect, useState, useRef } from "react";
import Header from "./components/Header";
import VaultInitializer from "./components/VaultInitializer";
import AddFileModal from "./components/AddFileModal";
import FileExistsDialog from "./components/FileExistsDialog";
import PasswordModal from "./components/PasswordModal";
import Dashboard from "./components/Dashboard";
import "./styles/datetimepicker.css";
import { useTheme } from "./context/ThemeContext";
import { tauriOpen, tauriInvoke } from "./tauri-wrapper";

export default function App() {
  const { dark } = useTheme();

  const [screen, setScreen] = useState("splash");

  const [vaultPath, setVaultPath] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [log, setLog] = useState("");
  const [vaultInfo, setVaultInfo] = useState({
    created: "—",
    last_server_time: "—",
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [pickedDir, setPickedDir] = useState("");
  const [pickedFile, setPickedFile] = useState("");
  const [fileUnlockDate, setFileUnlockDate] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const [showFileExistsDialog, setShowFileExistsDialog] = useState(false);
  const [fileExistsData, setFileExistsData] = useState({
    existingFilename: "",
    newFilename: "",
    fileToAdd: "",
    unlockDate: null,
    password: ""
  });
  const [cachedVaultPassword, setCachedVaultPassword] = useState("");
  const [showVaultPasswordModal, setShowVaultPasswordModal] = useState(false);
  const [pendingVaultPath, setPendingVaultPath] = useState("");
  const [isVaultPasswordProcessing, setIsVaultPasswordProcessing] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounterRef = useRef(0);
  const dragOverlayTimeoutRef = useRef(null);
  const [showUnlockPasswordModal, setShowUnlockPasswordModal] = useState(false);
  const [fileToUnlock, setFileToUnlock] = useState(null);

  useEffect(() => {
    if (pickedFile && screen === "dashboard" && !showAddFile) {
      setShowAddFile(true);
    }
  }, [pickedFile, screen, showAddFile]);

  const dropRef = useRef();

  const appendLog = (s) => setLog((prev) => prev + s + "\n");

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

  // Helper: probe if a path is a vault folder using existing backend info endpoint
  async function isVaultFolder(path) {
    try {
      const info = await tauriInvoke("vault_info", { vaultDir: path });
      return !!info;
    } catch (_) {
      return false;
    }
  }

  // Global drag & drop handlers: splash → open vault; dashboard → add file
  useEffect(() => {
    const onDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(true);
    };

    const onDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      setIsDraggingOver(true);
    };

    const onDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        // small delay to avoid flicker
        if (dragOverlayTimeoutRef.current) clearTimeout(dragOverlayTimeoutRef.current);
        dragOverlayTimeoutRef.current = setTimeout(() => setIsDraggingOver(false), 120);
      }
    };

    const onDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      if (dragOverlayTimeoutRef.current) clearTimeout(dragOverlayTimeoutRef.current);
      setIsDraggingOver(false);

      const droppedFiles = Array.from(e.dataTransfer?.files || []);
      const textData = e.dataTransfer?.getData?.("text") || "";

      if (screen === "splash") {
        // Expect a vault directory; try text path or first file path
        const candidatePath = (droppedFiles[0] && (droppedFiles[0].path || droppedFiles[0].webkitRelativePath)) || textData || "";
        if (!candidatePath) {
          appendLog("Drop a vault folder to open");
          return;
        }
        appendLog("Folder dropped: " + candidatePath);
        if (await isVaultFolder(candidatePath)) {
          setPendingVaultPath(candidatePath);
          setShowVaultPasswordModal(true);
        } else {
          appendLog("Not a vault folder. Please choose a valid vault folder.");
        }
        return;
      }

      if (screen === "dashboard") {
        if (!droppedFiles.length) {
          appendLog("Please drop a file to add");
          return;
        }
        const first = droppedFiles[0];
        const filePath = first.path || textData || "";
        if (!filePath) {
          // Fallback to file picker if path not available from drop
          appendLog("Could not read dropped file path. Opening picker...");
          const picked = await pickFileForAdd();
          if (picked) {
            setShowAddFile(true);
          }
          return;
        }
        appendLog("File dropped: " + (filePath.split(/[\\\/]/).pop() || "file"));
        setPickedFile(filePath);
        setShowAddFile(true);
        return;
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    document.addEventListener("dragenter", onDragEnter);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
      document.removeEventListener("dragenter", onDragEnter);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragleave", onDragLeave);
      document.removeEventListener("drop", onDrop);
    };
  }, [screen]);

  async function refreshVaultStatus(path, silent = false, password = null) {
    try {
      if (!silent) {
        appendLog("Verifying saved files...");
      }
      
      const passwordToUse = password || cachedVaultPassword;
      
      if (!passwordToUse) {
        console.log("No password available for status check");
        setFiles([]);
        if (!silent) {
          appendLog("No password available - skipping file verification");
        }
        return;
      }
      
      const fileList = await tauriInvoke("status_with_password", { 
        vaultPath: path,
        password: passwordToUse 
      });
      
      // Check for tampering warnings and (optionally) display them
      if (Array.isArray(fileList)) {
        const tamperingWarningEntry = fileList.find(item => item._tampering_warnings);
        if (!silent && tamperingWarningEntry && tamperingWarningEntry._tampering_warnings) {
          // Display tampering warnings in activity log only when not silent
          tamperingWarningEntry._tampering_warnings.forEach(warning => {
            appendLog(warning);
          });
        }
        
        // Filter out tampering warnings from the file list
        const actualFiles = fileList.filter(item => !item._tampering_warnings);
        setFiles(actualFiles);
        
        if (!silent) {
          const fileCount = actualFiles.length;
          if (fileCount === 0) {
            appendLog("Vault is empty - no files to verify");
          } else {
            appendLog(`${fileCount} files verified successfully`);
          }
        }
      } else {
        setFiles([]);
        if (!silent) {
          appendLog("Vault is empty - no files to verify");
        }
      }
    } catch (e) {
      console.error("refreshVaultStatus", e);
      appendLog("Error refreshing status: " + (e?.message || e));
    }
  }

  async function refreshVaultInfo(path) {
    try {
      appendLog("Verifying date and time...");
      const info = await tauriInvoke("refresh_server_time", { vaultDir: path });
      if (info) {
        setVaultInfo({
          created: info.created || "—",
          last_server_time: info.last_server_time || "—",
        });
        // Log only once with the server that actually provided the time
        if (info.time_source) {
          appendLog(`Date and time verified from ${info.time_source}`);
        } else {
          appendLog("Date and time verified from server");
        }
      }
    } catch (e) {
      console.error("refreshVaultInfo", e);
      appendLog("Error: " + (e?.message || e) + "Please check your internet connection");
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

  const openExistingVault = async () => {
    setScreen("splash");
    await new Promise((r) => setTimeout(r, 50));
    try {
      const path = await tauriOpen({ directory: true, multiple: false });
      const chosen = Array.isArray(path) ? path[0] : path;
      if (!chosen) return;

      setPendingVaultPath(chosen);
      setShowVaultPasswordModal(true);
      return chosen;
    } catch (e) {
      console.error("openExistingVault", e);
      appendLog("Error opening vault: " + (e?.message || e));
      return null;
    }
  };

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

      await tauriInvoke("init_vault_tauri", {
        vaultDir: vaultPath,
        password: vaultPassword,
      });

      appendLog("Vault initialized at " + vaultPath);
      setVaultPath(vaultPath);
      setCachedVaultPassword(vaultPassword);
      setShowCreate(false);
      setScreen("dashboard");
      setLog(""); 

      await refreshVaultStatus(vaultPath, false, vaultPassword);
      await refreshVaultInfo(vaultPath);
    } catch (e) {
      console.error("initializeVault", e);
      appendLog("Error initializing vault: " + (e?.message || e));
    } finally {
      setIsInitializing(false);
    }
  };

  const serializeFilename = (filename, n) => {
    const lastDotIndex = filename.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      return `${filename} (${n})`;
    } else {
      const name = filename.substring(0, lastDotIndex);
      const ext = filename.substring(lastDotIndex);
      return `${name} (${n})${ext}`;
    }
  };

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
      throw e; 
    }
  };

  const addFileToVault = async (password, fileToAdd, unlockDate) => {
    if (!vaultPath) return;
    if (!fileToAdd) return;
    if (!unlockDate) return;
    if (!password) return;

    const unlockUnix = Math.floor(unlockDate.getTime() / 1000);

    try {
      appendLog("Encrypting and adding file...");
      await tauriInvoke("add_file_tauri", {
        vaultDir: vaultPath,
        filePath: fileToAdd,
        password,
        fileUnlockDate: unlockUnix,
      });

      appendLog(`File added: ${fileToAdd.split(/[\\/]/).pop()}`);
      setCachedVaultPassword(password);
      await refreshVaultStatus(vaultPath, true, password);
    } catch (e) {
      console.error("addFileToVault", e);
      const errorMsg = e?.message || e;
      
      if (errorMsg.startsWith("FILE_EXISTS:")) {
        const existingFilename = errorMsg.split(":")[1];
        const newFilename = serializeFilename(existingFilename, 1);
        
        appendLog(`FILE_EXISTS error detected for: ${existingFilename}`);
        setFileExistsData({
          existingFilename,
          newFilename,
          fileToAdd,
          unlockDate,
          password
        });
        setShowFileExistsDialog(true);
        return; 
      } else {
        appendLog("Error: " + errorMsg);
      }
    }
  };

  const handleFileExistsRename = async () => {
    const { fileToAdd, unlockDate, password } = fileExistsData;
    const unlockUnix = Math.floor(unlockDate.getTime() / 1000);
    
    setShowFileExistsDialog(false);
    
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

  const unlockSingle = async (file, password, statusCallback) => {
    if (!vaultPath || !password) return;

    try {
      appendLog("Verifying vault password...");
      if (statusCallback) statusCallback("Verifying vault password...");
      await tauriInvoke("verify_vault_password", {
        vaultDir: vaultPath,
        password,
      });
      appendLog("Password verified successfully");
      if (statusCallback) statusCallback("Password verified successfully");

      const vaultDir = vaultPath.substring(0, vaultPath.lastIndexOf(/[\\/]/.test(vaultPath) ? (vaultPath.includes('/') ? '/' : '\\') : '/'));
      const unlockedDir = vaultDir + (vaultPath.includes('/') ? '/' : '\\') + 'Unlocked Files';
      
      if (statusCallback) statusCallback(`Decrypting and Unlocking file...`);
      // Log to activity so users see progress after the password prompt closes
      const targetName = file.name || file.filename;
      appendLog(`Decrypting and Unlocking file: ${targetName}...`);
      const result = await tauriInvoke("unlock_file_tauri", {
        vaultDir: vaultPath,
        outDir: unlockedDir,
        password,
        filename: targetName,
      });
      // Try to highlight the selected filename in the result if present; otherwise show concise message
      try {
        const parsed = typeof result === 'string' ? JSON.parse(result.replace(/^[^\[]*/,'').replace(/}.*$/,'')) : result;
        // no-op: result format varies; keep concise log instead
      } catch {}
      appendLog(`File unlocked to: ${unlockedDir}`);
      // Suppress post-unlock status logs for single-file flow
      await refreshVaultStatus(vaultPath, true);
    } catch (e) {
      console.error("unlockSingle", e);
      const errorMsg = e?.message || e;
      appendLog("Error: " + errorMsg);
      if (statusCallback) statusCallback("Error: " + errorMsg);
      throw e; 
    }
  };

  const unlockAll = async (password, statusCallback) => {
    if (!vaultPath || !password) return;

    try {
      appendLog("Verifying vault password...");
      if (statusCallback) statusCallback("Verifying vault password");
      await tauriInvoke("verify_vault_password", {
        vaultDir: vaultPath,
        password,
      });
      appendLog("Password verified successfully");
      if (statusCallback) statusCallback("Password verified successfully");

      const vaultDir = vaultPath.substring(0, vaultPath.lastIndexOf(/[\\/]/.test(vaultPath) ? (vaultPath.includes('/') ? '/' : '\\') : '/'));
      const unlockedDir = vaultDir + (vaultPath.includes('/') ? '/' : '\\') + 'Unlocked Files';

      appendLog("Decrypting and unlocking all eligible files...");
      appendLog(`Output directory: ${unlockedDir}`);
      if (statusCallback) statusCallback("Decrypting and unlocking all eligible files...");
      
      const result = await tauriInvoke("unlock_vault_tauri", {
        vaultDir: vaultPath,
        outDir: unlockedDir,
        password,
      });
      appendLog(result);
      appendLog("Vault unlock complete!");

      setCachedVaultPassword(password);
      await refreshVaultStatus(vaultPath, false, password);
      await refreshVaultInfo(vaultPath);
    } catch (e) {
      console.error("unlockAll", e);
      const errorMsg = e?.message || e;
      appendLog("Error: " + errorMsg);
      if (statusCallback) statusCallback("Error: " + errorMsg);
      throw e; 
    }
  };

  const handleVaultPasswordSubmit = async (password) => {
    setIsVaultPasswordProcessing(true);
    try {
      await tauriInvoke("verify_vault_password", {
        vaultDir: pendingVaultPath,
        password,
      });
      
      setVaultPath(pendingVaultPath);
      setCachedVaultPassword(password);
      setShowVaultPasswordModal(false);
      setPendingVaultPath("");
      setScreen("dashboard");
      setLog("");
      
      await refreshVaultStatus(pendingVaultPath, false, password);
      await refreshVaultInfo(pendingVaultPath);
    } catch (e) {
      console.error("handleVaultPasswordSubmit", e);
      appendLog("Invalid vault password. Please try again.");
    } finally {
      setIsVaultPasswordProcessing(false);
    }
  };

  const handleVaultPasswordCancel = () => {
    setShowVaultPasswordModal(false);
    setPendingVaultPath("");
    setIsVaultPasswordProcessing(false);
  };

  const exitVault = () => {
    setCachedVaultPassword("");
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
            <div className="mx-auto w-32 h-32 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-xl overflow-hidden">
              <img 
                src="/timevault_logo.svg" 
                alt="Time Vault Logo" 
                className="w-50 h-50 object-contain max-w-full max-h-full"
                style={{ maxWidth: '200px', maxHeight: '200px' }}
              />
            </div>

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
            onPasswordVerified={setCachedVaultPassword}
          />
        )}
      </main>

      {log && !showCreate && screen !== "dashboard" && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-sm overflow-y-auto max-h-48">
          <pre>{log}</pre>
        </div>
      )}
    </div>

    {/* Drag overlay indicator */}
    {isDraggingOver && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '2px dashed rgba(99, 102, 241, 0.6)',
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#6366f1',
            fontWeight: 700,
            fontSize: '1.125rem',
            textAlign: 'center'
          }}
        >
          Drop to {screen === 'splash' ? 'open this vault folder' : 'add this file'}
        </div>
      </div>
    )}

    {showCreate && (
        <VaultInitializer
          setShowCreate={setShowCreate}
          dropRef={dropRef}
          pickedDir={pickedDir}
          setPickedDir={setPickedDir}
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
          const fileToAdd = pickedFile;
          const unlockDate = fileUnlockDate;
          setPickedFile("");
          setFileUnlockDate(null);
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

    {showVaultPasswordModal && (
      <PasswordModal
        isOpen={showVaultPasswordModal}
        onClose={handleVaultPasswordCancel}
        onSubmit={handleVaultPasswordSubmit}
        title="Enter Vault Password"
        isProcessing={isVaultPasswordProcessing}
      />
    )}
    </>
  );
}
