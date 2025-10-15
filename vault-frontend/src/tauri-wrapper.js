// tauri-wrapper.js
// Desktop-only version: pure Tauri environment, no browser fallbacks.

export const tauriOpen = async (opts = {}) => {
  try {
    // ✅ Use the Tauri v2 dialog plugin
    const { open } = await import("@tauri-apps/plugin-dialog");

    // `open()` returns the absolute file or folder path(s)
    const result = await open(opts);

    if (!result) {
      console.warn("No file/folder selected.");
      return null;
    }

    // Normalize for both single and multiple selections
    if (Array.isArray(result)) {
      return result.map((path) => path.toString());
    }

    return result.toString();
  } catch (err) {
    console.error("❌ Error opening file/folder dialog:", err);
    throw new Error(
      "Failed to open file/folder dialog. Ensure @tauri-apps/plugin-dialog is installed and enabled."
    );
  }
};

export const tauriInvoke = async (cmd, payload) => {
  try {
    // ✅ Correct Tauri v2 import for core invocations
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke(cmd, payload);
  } catch (err) {
    console.error(`❌ tauriInvoke failed for command "${cmd}":`, err);
    throw err;
  }
};
