/// PI Academy desktop shell. All app logic lives in the web frontend; the shell only
/// provides a window, file access scoped to the app-data folder, and save/open dialogs.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running PI Academy");
}
