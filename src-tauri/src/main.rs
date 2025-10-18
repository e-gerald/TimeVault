mod vault;

use tauri_plugin_dialog::init as dialog_init;

fn main() {
    tauri::Builder::default()
        // ✅ Register dialog plugin
        .plugin(dialog_init())
        .invoke_handler(tauri::generate_handler![
            vault::init_vault_tauri,
            vault::add_file_tauri,
            vault::unlock_vault_tauri,
            vault::status,
            vault::vault_info,
            vault::refresh_server_time,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
