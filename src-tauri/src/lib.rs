// src-tauri/src/lib.rs
// Phase 6: Added export_note_pdf command — triggers the system print dialog
// on the current window, which Tauri/Wry exposes via WebView's print() API.

use tauri::Manager;

#[tauri::command]
async fn export_note_pdf(window: tauri::Window) -> Result<(), String> {
    // Trigger the WebView's native print dialog.
    // The frontend's print-optimised CSS (see App.css @media print) takes over
    // from here — the ClinicalSummaryView already applies print styles.
    window
        .print()
        .map_err(|e| format!("Print failed: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![export_note_pdf])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}