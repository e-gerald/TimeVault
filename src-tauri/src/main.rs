#![windows_subsystem = "windows"]

mod vault;

use tauri_plugin_dialog::init as dialog_init;

fn main() {
    tauri::Builder::default()
        .plugin(dialog_init())
        .invoke_handler(tauri::generate_handler![
            vault::init_vault_tauri,
            vault::add_file_tauri,
            vault::add_file_with_custom_name,
            vault::unlock_vault_tauri,
            vault::unlock_file_tauri,
            vault::status_with_password,
            vault::vault_info,
            vault::refresh_server_time,
            vault::verify_vault_password,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
