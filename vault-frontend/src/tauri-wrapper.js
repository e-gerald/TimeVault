export const tauriOpen = async (opts = {}) => {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");

    const result = await open(opts);

    if (!result) {
      console.warn("No file/folder selected.");
      return null;
    }

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
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke(cmd, payload);
  } catch (err) {
    console.error(`❌ tauriInvoke failed for command "${cmd}":`, err);
    throw err;
  }
};
