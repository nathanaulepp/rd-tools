// src-tauri/src/lib.rs
// via eval() on the WebviewWindow.

#[tauri::command]
async fn export_note_pdf(webview: tauri::WebviewWindow) -> Result<(), String> {
    // Evaluate JavaScript on the frontend to trigger the native print dialog.
    // The frontend's print-optimised CSS (see App.css @media print) takes over
    // from here — the ClinicalSummaryView already applies print styles.
    webview
        .eval("window.print()")
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