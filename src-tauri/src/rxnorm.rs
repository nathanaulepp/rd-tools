// src-tauri/src/rxnorm.rs
//
// RxNorm Full Release ETL — Tauri command
//
// WHAT THIS DOES:
//   1. Downloads the current monthly RxNorm Full Release ZIP from NLM.
//   2. Extracts RXNCONSO.RRF from the archive (streaming, never fully decompressing to disk).
//   3. Streams through lines, filters TTY = "SCD".
//   4. Parses ingredient / strength / unit / dose-form from the structured SCD display name.
//   5. Batch-inserts into drugs.db  rxnorm_products  table.
//   6. Emits tauri events so the frontend can show a live progress bar.
//
// TAURI EVENT CHANNEL:  "rxnorm://progress"
//   payload: RxNormProgress  (see struct below)
//
// INVOCATION (TypeScript):
//   await invoke("sync_rxnorm", { apiKey: "your-umls-api-key" });
//
// UMLS API KEY:
//   The NLM requires a free UMLS account.  The key is stored in the OS keychain
//   via tauri-plugin-store and passed from the Settings page.
//   Download URL pattern:
//     https://download.nlm.nih.gov/umls/kss/rxnorm/RxNorm_full_{MMDDYYYY}.zip
//   The "current" stable redirect used here:
//     https://download.nlm.nih.gov/rxnorm/RxNorm_full_current.zip
//     (requires apikey= query param)
//
// ─────────────────────────────────────────────────────────────────────────────

use std::io::{BufRead, BufReader, Read};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Emitter, Manager};
use zip::ZipArchive;

// ── Progress event payload ────────────────────────────────────────────────────

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RxNormProgress {
    pub stage: String,        // "downloading" | "extracting" | "importing" | "done" | "error"
    pub message: String,
    pub rows_inserted: u64,
    pub percent: f32,         // 0–100
}

// ── Column indices in RXNCONSO.RRF (pipe-delimited, 18 fields + trailing |) ──

const COL_RXCUI:  usize = 0;
const COL_TTY:    usize = 12;
const COL_STR:    usize = 14;

// ── Parsed SCD components ─────────────────────────────────────────────────────

struct ScdParts {
    ingredient:     String,
    strength_value: Option<f64>,
    strength_unit:  String,
    dose_form:      String,
}

/// Parses structured fields from an SCD display string.
///
/// SCD names follow the NLM convention:
///   "{Ingredient(s)} {Strength} {Unit} {DoseForm}"
///   e.g. "Acetaminophen 500 MG Oral Tablet"
///        "Amoxicillin 250 MG / 5 ML Oral Suspension"
///        "Hydrocodone Bitartrate 5 MG / Acetaminophen 325 MG Oral Tablet"
///
/// Multi-ingredient products will have the full name as ingredient.
fn parse_scd(display: &str) -> ScdParts {
    // Known strength units (ordered longest-first to avoid partial matches)
    const UNITS: &[&str] = &[
        "MG/ACTUAT", "MG/ML", "MCG/ACTUAT", "MCG/ML", "MEQ/ML",
        "MMOL/ML", "MG", "MCG", "MEQ", "MMOL", "IU", "ML", "%",
        "MCI",
    ];

    let upper = display.to_uppercase();

    // Find first strength unit match
    let mut strength_value: Option<f64> = None;
    let mut strength_unit = String::new();
    let mut strength_pos: Option<usize> = None; // byte position of the number before unit

    'outer: for unit in UNITS {
        if let Some(unit_start) = upper.find(unit) {
            // Walk backward from unit_start to find the number
            let prefix = &display[..unit_start].trim_end();
            // Find trailing number (may be decimal)
            let num_str: String = prefix
                .chars()
                .rev()
                .take_while(|c| c.is_ascii_digit() || *c == '.')
                .collect::<String>()
                .chars()
                .rev()
                .collect();

            if !num_str.is_empty() {
                if let Ok(v) = num_str.parse::<f64>() {
                    strength_value = Some(v);
                    strength_unit  = unit.to_string();
                    // Position = start of the number in the original string
                    strength_pos   = Some(unit_start + unit.len());
                    break 'outer;
                }
            }
        }
    }

    // Ingredient = everything before the strength number
    let ingredient = if let Some(sv) = strength_value {
        let sv_str = format!("{}", sv);
        // Find position of the number in the original display string
        if let Some(num_pos) = display.find(&sv_str) {
            display[..num_pos].trim().to_string()
        } else {
            display.to_string()
        }
    } else {
        display.to_string()
    };

    // Dose form = text after the strength block
    let dose_form = if let Some(pos) = strength_pos {
        if pos < display.len() {
            display[pos..].trim().to_string()
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    ScdParts {
        ingredient,
        strength_value,
        strength_unit: strength_unit.to_lowercase()
            .replace("mg/actuat", "mg/actuat")
            .replace("mcg/actuat", "mcg/actuat"),
        dose_form,
    }
}

// ── Database helpers ──────────────────────────────────────────────────────────

fn db_path(app: &AppHandle) -> PathBuf {
    app.path()
        .app_data_dir()
        .expect("app data dir must exist")
        .join("drugs.db")
}

fn open_db(path: &PathBuf) -> Result<Connection, String> {
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")
        .map_err(|e| e.to_string())?;
    Ok(conn)
}

fn ensure_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS rxnorm_products (
            rxcui          TEXT PRIMARY KEY,
            display_name   TEXT NOT NULL,
            ingredient     TEXT NOT NULL DEFAULT '',
            strength_value REAL,
            strength_unit  TEXT NOT NULL DEFAULT '',
            dose_form      TEXT NOT NULL DEFAULT '',
            tty            TEXT NOT NULL DEFAULT 'SCD'
        );
        CREATE INDEX IF NOT EXISTS idx_rxnorm_display
            ON rxnorm_products(display_name);
        CREATE TABLE IF NOT EXISTS rxnorm_meta (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );",
    )
    .map_err(|e| e.to_string())
}

fn get_meta(conn: &Connection, key: &str) -> Option<String> {
    conn.query_row(
        "SELECT value FROM rxnorm_meta WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
    .ok()
}

fn set_meta(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT OR REPLACE INTO rxnorm_meta (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn is_stale(conn: &Connection) -> bool {
    let Some(ts_str) = get_meta(conn, "last_sync_epoch_secs") else {
        return true;
    };
    let Ok(ts) = ts_str.parse::<u64>() else { return true };
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let days_30 = 30 * 24 * 3600;
    now.saturating_sub(ts) > days_30
}

// ── Download helpers ──────────────────────────────────────────────────────────

/// Downloads the RxNorm full release zip into a temp file.
/// Returns the path to the downloaded file.
fn download_zip(
    app: &AppHandle,
    api_key: &str,
    emit: impl Fn(RxNormProgress),
) -> Result<PathBuf, String> {
    let url = format!(
        "https://download.nlm.nih.gov/rxnorm/RxNorm_full_current.zip?apiKey={}",
        api_key
    );

    let tmp_path = app
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("rxnorm_download.zip");

    emit(RxNormProgress {
        stage:         "downloading".into(),
        message:       "Connecting to NLM…".into(),
        rows_inserted: 0,
        percent:       0.0,
    });

    // Use ureq for a blocking HTTP download (no async runtime needed in Tauri commands).
    // ureq is already a common Tauri dependency; add to Cargo.toml if missing:
    //   ureq = { version = "2", features = ["tls"] }
    let response = ureq::get(&url)
        .call()
        .map_err(|e| format!("Download failed: {e}"))?;

    let content_length: Option<u64> = response
        .header("content-length")
        .and_then(|v| v.parse().ok());

    let mut reader = response.into_reader();
    let mut file   = std::fs::File::create(&tmp_path).map_err(|e| e.to_string())?;

    let mut downloaded: u64 = 0;
    let mut buf = vec![0u8; 64 * 1024]; // 64 KB chunks

    loop {
        let n = reader.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 { break; }
        std::io::Write::write_all(&mut file, &buf[..n]).map_err(|e| e.to_string())?;
        downloaded += n as u64;

        let pct = content_length
            .map(|total| (downloaded as f32 / total as f32) * 40.0) // download = 0–40%
            .unwrap_or(0.0);

        emit(RxNormProgress {
            stage:         "downloading".into(),
            message:       format!("Downloading… {:.1} MB", downloaded as f64 / 1_048_576.0),
            rows_inserted: 0,
            percent:       pct,
        });
    }

    Ok(tmp_path)
}

// ── RRF parsing + import ──────────────────────────────────────────────────────

/// Streams RXNCONSO.RRF from inside the zip, filtering SCD rows,
/// and batch-inserts into the database.
fn import_rrf(
    conn: &mut Connection,
    zip_path: &PathBuf,
    emit: impl Fn(RxNormProgress),
) -> Result<u64, String> {
    emit(RxNormProgress {
        stage:         "extracting".into(),
        message:       "Opening ZIP archive…".into(),
        rows_inserted: 0,
        percent:       40.0,
    });

    let file = std::fs::File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    // RXNCONSO.RRF may be nested: "RxNorm_full_MMDDYYYY/rrf/RXNCONSO.RRF"
    let rrf_index = (0..archive.len())
        .find(|&i| {
            archive
                .by_index(i)
                .map(|f| f.name().ends_with("RXNCONSO.RRF"))
                .unwrap_or(false)
        })
        .ok_or_else(|| "RXNCONSO.RRF not found in archive".to_string())?;

    let rrf_file = archive.by_index(rrf_index).map_err(|e| e.to_string())?;
    let rrf_size = rrf_file.size(); // uncompressed bytes for progress
    let reader = BufReader::with_capacity(1024 * 1024, rrf_file); // 1 MB read buffer

    emit(RxNormProgress {
        stage:         "importing".into(),
        message:       "Parsing RXNCONSO.RRF…".into(),
        rows_inserted: 0,
        percent:       45.0,
    });

    // Clear old data before import
    conn.execute("DELETE FROM rxnorm_products", [])
        .map_err(|e| e.to_string())?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    {
        let mut stmt = tx
            .prepare(
                "INSERT OR REPLACE INTO rxnorm_products
                    (rxcui, display_name, ingredient, strength_value, strength_unit, dose_form, tty)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'SCD')",
            )
            .map_err(|e| e.to_string())?;

        let mut rows_inserted: u64 = 0;
        let mut bytes_read: u64    = 0;
        let mut last_emit_rows: u64 = 0;
        const EMIT_INTERVAL: u64   = 500; // emit every 500 rows

        for line_result in reader.lines() {
            let line = line_result.map_err(|e| e.to_string())?;
            bytes_read += line.len() as u64 + 1; // +1 for newline

            // RXNCONSO.RRF is pipe-delimited with a trailing |
            // Split on | and collect columns
            let cols: Vec<&str> = line.split('|').collect();

            // Need at least 15 columns (STR is index 14)
            if cols.len() < 15 {
                continue;
            }

            let tty = cols[COL_TTY].trim();
            if tty != "SCD" {
                continue;
            }

            let rxcui   = cols[COL_RXCUI].trim();
            let display = cols[COL_STR].trim();

            if rxcui.is_empty() || display.is_empty() {
                continue;
            }

            let parts = parse_scd(display);

            stmt.execute(params![
                rxcui,
                display,
                parts.ingredient,
                parts.strength_value,
                parts.strength_unit,
                parts.dose_form,
            ])
            .map_err(|e| e.to_string())?;

            rows_inserted += 1;

            if rows_inserted - last_emit_rows >= EMIT_INTERVAL {
                last_emit_rows = rows_inserted;
                let pct = 45.0
                    + if rrf_size > 0 {
                        (bytes_read as f32 / rrf_size as f32) * 50.0
                    } else {
                        0.0
                    };
                emit(RxNormProgress {
                    stage:         "importing".into(),
                    message:       format!("{} SCD products imported…", rows_inserted),
                    rows_inserted,
                    percent:       pct.min(95.0),
                });
            }
        }

        // Drop stmt before committing
        drop(stmt);
        tx.commit().map_err(|e| e.to_string())?;
        Ok(rows_inserted)
    }
}

// ── Public Tauri command ──────────────────────────────────────────────────────

/// Tauri command: download + import the RxNorm full release.
///
/// Register in main.rs:
///   .invoke_handler(tauri::generate_handler![
///       ...,
///       crate::rxnorm::sync_rxnorm,
///   ])
///
/// Frontend invocation:
///   import { invoke } from "@tauri-apps/api/core";
///   await invoke("sync_rxnorm", { apiKey: umls_key, force: false });
#[command]
pub async fn sync_rxnorm(
    app: AppHandle,
    api_key: String,
    force: bool,
) -> Result<RxNormProgress, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let db_path = db_path(&app);

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let mut conn = open_db(&db_path)?;
        ensure_schema(&conn)?;

        // Check staleness
        if !force && !is_stale(&conn) {
            return Ok(RxNormProgress {
                stage:         "done".into(),
                message:       "RxNorm index is current — skipped sync.".into(),
                rows_inserted: 0,
                percent:       100.0,
            });
        }

        // Closure that emits progress events to the frontend window
        let app_clone = app.clone();
        let emit = move |progress: RxNormProgress| {
            let _ = app_clone.emit("rxnorm://progress", progress);
        };

        // Download
        let zip_path = match download_zip(&app, &api_key, &emit) {
            Ok(p)  => p,
            Err(e) => {
                let _ = app.emit("rxnorm://progress", RxNormProgress {
                    stage:         "error".into(),
                    message:       e.clone(),
                    rows_inserted: 0,
                    percent:       0.0,
                });
                return Err(e);
            }
        };

        // Parse + import (this is CPU / IO intensive — runs on the blocking thread pool)
        let rows = match import_rrf(&mut conn, &zip_path, &emit) {
            Ok(n)  => n,
            Err(e) => {
                let _ = app.emit("rxnorm://progress", RxNormProgress {
                    stage:         "error".into(),
                    message:       e.clone(),
                    rows_inserted: 0,
                    percent:       0.0,
                });
                // Clean up partial zip
                let _ = std::fs::remove_file(&zip_path);
                return Err(e);
            }
        };

        // Stamp sync date
        let epoch = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        set_meta(&conn, "last_sync_epoch_secs", &epoch.to_string())?;

        // Clean up temp zip
        let _ = std::fs::remove_file(&zip_path);

        let done = RxNormProgress {
            stage:         "done".into(),
            message:       format!("✓ {rows} RxNorm SCD products indexed."),
            rows_inserted: rows,
            percent:       100.0,
        };

        let _ = app.emit("rxnorm://progress", done.clone());
        Ok(done)
    })
    .await
    .map_err(|e| e.to_string())?
}

/// Check whether a sync is needed without triggering one.
/// Used by the Settings page to show "Last synced: X days ago".
#[command]
pub fn rxnorm_sync_status(app: AppHandle) -> serde_json::Value {
    let db_path = db_path(&app);
    let Ok(conn) = open_db(&db_path) else {
        return serde_json::json!({ "synced": false, "lastSyncEpoch": null, "productCount": 0 });
    };
    let _ = ensure_schema(&conn);

    let last_sync: Option<u64> = get_meta(&conn, "last_sync_epoch_secs")
        .and_then(|s| s.parse().ok());

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM rxnorm_products", [], |r| r.get(0))
        .unwrap_or(0);

    let stale = is_stale(&conn);

    serde_json::json!({
        "synced":        !stale,
        "lastSyncEpoch": last_sync,
        "productCount":  count,
        "needsSync":     stale,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Cargo.toml additions required:
//
// [dependencies]
// rusqlite  = { version = "0.31", features = ["bundled"] }
// zip       = "2"
// ureq      = { version = "2", features = ["tls"] }
// serde     = { version = "1", features = ["derive"] }
// serde_json = "1"
// tauri     = { version = "2", features = [...] }
//
// main.rs registration:
//   mod rxnorm;
//   ...
//   .invoke_handler(tauri::generate_handler![
//       rxnorm::sync_rxnorm,
//       rxnorm::rxnorm_sync_status,
//   ])
// ─────────────────────────────────────────────────────────────────────────────