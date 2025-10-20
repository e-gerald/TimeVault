use anyhow::{anyhow, Result};
use argon2::{Argon2, Params};
use base64::{engine::general_purpose, Engine as _};
use chrono::DateTime;
use rand::rngs::OsRng;
use rand::RngCore;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{XChaCha20Poly1305, XNonce, Key};
use zeroize::Zeroize;
use tokio::time::sleep;
use std::time::Duration as StdDuration;

#[derive(Serialize, Deserialize)]
pub struct VaultMetadata {
    pub version: u8,
    pub salt_b64: String,
    pub argon_mem_kib: u32,
    pub argon_iters: u32,
    pub argon_parallelism: u32,
    pub wrapped_fek_b64: String,
    pub wrap_nonce_b64: String,
    pub vault_unlock_date: u64,
    pub creation_ts: u64,
    pub last_verified_time: u64,
}

// New encrypted metadata structure
#[derive(Serialize, Deserialize)]
pub struct EncryptedFileMeta {
    pub encrypted_payload_b64: String,  // Encrypted JSON of FileMetaPayload
    pub metadata_nonce_b64: String,     // Nonce for metadata encryption
}

// Internal payload (not stored directly, always encrypted)
#[derive(Serialize, Deserialize, Clone)]
pub struct FileMetaPayload {
    pub filename: String,
    pub file_unlock_date: u64,
    pub nonce_b64: String,      // File encryption nonce
    pub ciphertext_b64: String, // Encrypted file content
}

fn default_argon_params() -> (u32, u32, u32) {
    (128 * 1024, 4, 1)
}

fn vault_meta_path(vault_dir: &Path) -> PathBuf {
    vault_dir.join("vault_metadata.json")
}

fn files_meta_dir(vault_dir: &Path) -> PathBuf {
    vault_dir.join("files_meta")
}

fn ensure_vault_dir(path: &Path) -> Result<()> {
    if !path.exists() {
        fs::create_dir_all(path)?;
    }
    Ok(())
}

fn derive_key(password: &str, salt: &[u8], mem_kib: u32, iters: u32, parallelism: u32) -> Result<[u8; 32]> {
    let params = Params::new(mem_kib, iters, parallelism, None).map_err(|e| anyhow!(e.to_string()))?;
    let argon = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);

    let mut out = [0u8; 32];
    argon.hash_password_into(password.as_bytes(), salt, &mut out).map_err(|e| anyhow!(e.to_string()))?;
    Ok(out)
}

fn encrypt_file_metadata(fek: &[u8; 32], payload: &FileMetaPayload) -> Result<(String, String)> {
    let aead = XChaCha20Poly1305::new(Key::from_slice(fek));
    let mut nonce_bytes = [0u8; 24];
    OsRng.fill_bytes(&mut nonce_bytes);
    
    let payload_json = serde_json::to_vec(payload)?;
    let encrypted = aead.encrypt(XNonce::from_slice(&nonce_bytes), payload_json.as_ref())?;
    
    Ok((
        general_purpose::STANDARD.encode(&encrypted),
        general_purpose::STANDARD.encode(&nonce_bytes)
    ))
}

fn decrypt_file_metadata(fek: &[u8; 32], encrypted_b64: &str, nonce_b64: &str) -> Result<FileMetaPayload> {
    let aead = XChaCha20Poly1305::new(Key::from_slice(fek));
    let encrypted = general_purpose::STANDARD.decode(encrypted_b64)?;
    let nonce = general_purpose::STANDARD.decode(nonce_b64)?;
    
    let decrypted = aead.decrypt(XNonce::from_slice(&nonce), encrypted.as_ref())
        .map_err(|_| anyhow!("Metadata decryption failed - possible tampering detected"))?;
    
    let payload: FileMetaPayload = serde_json::from_slice(&decrypted)?;
    Ok(payload)
}

async fn fetch_public_unixtime_with_retries() -> Result<(u64, String)> {
    let endpoints = vec![
        ("https://worldtimeapi.org/api/timezone/Etc/UTC", "[Server 1]"),
        ("http://worldclockapi.com/api/json/utc/now", "[Server 2]"),
        ("https://timeapi.io/api/Time/current/zone?timeZone=UTC", "[Server 3]"),
        ("https://worldtimeapi.org/api/ip", "[Server 4]"),
    ];

    let client = Client::builder()
        .user_agent("vault-client/1.0")
        .build()?;

    for (url, label) in &endpoints {
        let mut attempt = 0u32;
        let max_attempts = 3u32;
        loop {
            attempt += 1;
            match client.get(*url).send().await {
                Ok(resp) => {
                    if resp.status().is_success() {
                        if let Ok(json) = resp.json::<serde_json::Value>().await {
                            if *label == "[Server 3]" {
                                if let Some(dt) = json["dateTime"].as_str() {
                                    if let Ok(parsed) = DateTime::parse_from_rfc3339(dt) {
                                        return Ok((parsed.timestamp() as u64, label.to_string()));
                                    }
                                }
                            } else if *label == "[Server 1]" || *label == "[Server 4]" {
                                if let Some(epoch) = json["unixtime"].as_i64() {
                                    return Ok((epoch as u64, label.to_string()));
                                }
                            } else if *label == "[Server 2]" {
                                if let Some(dt) = json["currentDateTime"].as_str() {
                                    if let Ok(parsed) = DateTime::parse_from_rfc3339(dt) {
                                        return Ok((parsed.timestamp() as u64, label.to_string()));
                                    }
                                }
                                if let Some(filetime) = json["currentFileTime"].as_i64() {
                                    let unix_time = (filetime / 10_000_000) - 11_644_473_600;
                                    return Ok((unix_time as u64, label.to_string()));
                                }
                            }
                        }
                    }
                }
                Err(_) => {}
            }
            if attempt >= max_attempts {
                break;
            }
            let backoff = 500u64 * (1u64 << (attempt - 1));
            sleep(StdDuration::from_millis(backoff)).await;
        }
    }

    Err(anyhow!("Date and time vertification failed. "))
}

pub fn init_vault(vault_dir: String, password: String, vault_unlock_date: u64) -> Result<()> {
    let vault_path = Path::new(&vault_dir);
    ensure_vault_dir(vault_path)?;

    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);

    let (mem_kib, iters, parallelism) = default_argon_params();

    let mut derived = derive_key(&password, &salt, mem_kib, iters, parallelism)?;
    let mut fek = [0u8; 32];
    OsRng.fill_bytes(&mut fek);

    let wrap_key = Key::from_slice(&derived);
    let aead = XChaCha20Poly1305::new(wrap_key);
    let mut wrap_nonce = [0u8; 24];
    OsRng.fill_bytes(&mut wrap_nonce);
    let wrapped = aead.encrypt(XNonce::from_slice(&wrap_nonce), fek.as_ref())?;

    let meta = VaultMetadata {
        version: 1,
        salt_b64: general_purpose::STANDARD.encode(&salt),
        argon_mem_kib: mem_kib,
        argon_iters: iters,
        argon_parallelism: parallelism,
        wrapped_fek_b64: general_purpose::STANDARD.encode(&wrapped),
        wrap_nonce_b64: general_purpose::STANDARD.encode(&wrap_nonce),
        vault_unlock_date,
        creation_ts: SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs(),
        last_verified_time: 0,
    };

    fs::write(vault_meta_path(vault_path), serde_json::to_vec_pretty(&meta)?)?;
    let fm = files_meta_dir(vault_path);
    if !fm.exists() {
        fs::create_dir_all(&fm)?;
    }

    derived.zeroize();
    fek.zeroize();
    salt.zeroize();
    wrap_nonce.zeroize();

    Ok(())
}

pub fn add_file_with_name(vault_dir: String, file_path: String, password: String, file_unlock_date: u64, custom_filename: Option<String>) -> Result<()> {
    let vault_path = Path::new(&vault_dir);
    let file = Path::new(&file_path);
    let meta_path = vault_meta_path(vault_path);
    let meta_raw = fs::read(&meta_path)?;
    let meta: VaultMetadata = serde_json::from_slice(&meta_raw)?;

    let fname = if let Some(custom_name) = custom_filename {
        custom_name
    } else {
        file.file_name().ok_or_else(|| anyhow!("bad filename"))?.to_string_lossy().to_string()
    };
    
    // Derive FEK first (needed for file existence check)
    let salt = general_purpose::STANDARD.decode(&meta.salt_b64).map_err(|e| anyhow!(e.to_string()))?;
    let derived = derive_key(&password, &salt, meta.argon_mem_kib, meta.argon_iters, meta.argon_parallelism)?;
    let wrapped = general_purpose::STANDARD.decode(&meta.wrapped_fek_b64).map_err(|e| anyhow!(e.to_string()))?;
    let wrap_nonce = general_purpose::STANDARD.decode(&meta.wrap_nonce_b64).map_err(|e| anyhow!(e.to_string()))?;
    let aead = XChaCha20Poly1305::new(Key::from_slice(&derived));
    let fek = aead.decrypt(XNonce::from_slice(&wrap_nonce), wrapped.as_ref())
        .map_err(|_| anyhow!("Invalid password. Please check your password and try again."))?;

    let mut fek_arr = [0u8; 32];
    if fek.len() < 32 {
        return Err(anyhow!("FEK length is invalid"));
    }
    fek_arr.copy_from_slice(&fek[0..32]);
    
    let fm_dir = files_meta_dir(vault_path);
    if fm_dir.exists() {
        for entry in fs::read_dir(&fm_dir)? {
            let path = entry?.path();
            if path.is_file() {
                let raw = fs::read(&path)?;
                if let Ok(encrypted_meta) = serde_json::from_slice::<EncryptedFileMeta>(&raw) {
                    // Try to decrypt metadata to check filename
                    if let Ok(payload) = decrypt_file_metadata(&fek_arr, &encrypted_meta.encrypted_payload_b64, &encrypted_meta.metadata_nonce_b64) {
                        if payload.filename == fname {
                            return Err(anyhow!("FILE_EXISTS:{}", fname));
                        }
                    }
                }
            }
        }
    }

    let plaintext = fs::read(file)?;
    let aead_fek = XChaCha20Poly1305::new(Key::from_slice(&fek_arr));
    let mut nonce_bytes = [0u8; 24];
    OsRng.fill_bytes(&mut nonce_bytes);
    let ciphertext = aead_fek.encrypt(XNonce::from_slice(&nonce_bytes), plaintext.as_ref())?;

    let locked_name = format!(".locked_{}", fname);
    fs::write(vault_path.join(&locked_name), &ciphertext)?;

    // Create metadata payload
    let payload = FileMetaPayload {
        filename: fname.clone(),
        file_unlock_date,
        nonce_b64: general_purpose::STANDARD.encode(&nonce_bytes),
        ciphertext_b64: general_purpose::STANDARD.encode(&ciphertext),
    };

    // Encrypt the metadata
    let (encrypted_payload_b64, metadata_nonce_b64) = encrypt_file_metadata(&fek_arr, &payload)?;

    // Create encrypted metadata structure
    let file_meta = EncryptedFileMeta {
        encrypted_payload_b64,
        metadata_nonce_b64,
    };

    let meta_fname = format!("{}.meta.json", locked_name);
    fs::write(files_meta_dir(vault_path).join(meta_fname), serde_json::to_vec_pretty(&file_meta)?)?;

    let mut zero_me = fek_arr;
    zero_me.zeroize();

    Ok(())
}

pub fn add_file(vault_dir: String, file_path: String, password: String, file_unlock_date: u64) -> Result<()> {
    add_file_with_name(vault_dir, file_path, password, file_unlock_date, None)
}

pub async fn unlock_vault(vault_dir: String, out_dir: String, password: String) -> Result<String> {
    let vault_path = Path::new(&vault_dir);
    let out_path = Path::new(&out_dir);

    let meta_path = vault_meta_path(vault_path);
    let meta_raw = fs::read(&meta_path)?;
    let mut meta: VaultMetadata = serde_json::from_slice(&meta_raw)?;

    let salt = general_purpose::STANDARD.decode(&meta.salt_b64).map_err(|e| anyhow!(e.to_string()))?;
    let derived = derive_key(&password, &salt, meta.argon_mem_kib, meta.argon_iters, meta.argon_parallelism)?;
    let wrapped = general_purpose::STANDARD.decode(&meta.wrapped_fek_b64).map_err(|e| anyhow!(e.to_string()))?;
    let wrap_nonce = general_purpose::STANDARD.decode(&meta.wrap_nonce_b64).map_err(|e| anyhow!(e.to_string()))?;
    let fek = XChaCha20Poly1305::new(Key::from_slice(&derived))
        .decrypt(XNonce::from_slice(&wrap_nonce), wrapped.as_ref())
        .map_err(|_| anyhow!("Invalid password. Please check your password and try again."))?;

    let (server_time, _) = fetch_public_unixtime_with_retries().await?;
    if meta.last_verified_time != 0 && server_time < meta.last_verified_time {
        return Err(anyhow!("Public time regression detected"));
    }

    fs::create_dir_all(out_path)?;

    let mut fek_arr = [0u8; 32];
    if fek.len() < 32 {
        return Err(anyhow!("FEK length is invalid"));
    }
    fek_arr.copy_from_slice(&fek[0..32]);
    let aead_fek = XChaCha20Poly1305::new(Key::from_slice(&fek_arr));

    let fm_dir = files_meta_dir(vault_path);
    let mut decrypted_files = vec![];

    if fm_dir.exists() {
        for entry in fs::read_dir(fm_dir)? {
            let path = entry?.path();
            if path.is_file() {
                let raw = fs::read(&path)?;
                match serde_json::from_slice::<EncryptedFileMeta>(&raw) {
                    Ok(encrypted_meta) => {
                        // Decrypt metadata
                        match decrypt_file_metadata(&fek_arr, &encrypted_meta.encrypted_payload_b64, &encrypted_meta.metadata_nonce_b64) {
                            Ok(payload) => {
                                // Check if unlocked
                                if server_time >= payload.file_unlock_date {
                                    let locked_path = vault_path.join(format!(".locked_{}", payload.filename));
                                    if locked_path.exists() {
                                        let ciphertext = fs::read(&locked_path)?;
                                        let nonce_bytes = general_purpose::STANDARD.decode(&payload.nonce_b64)?;
                                        if let Ok(plaintext) = aead_fek.decrypt(XNonce::from_slice(&nonce_bytes), ciphertext.as_ref()) {
                                            fs::write(out_path.join(&payload.filename), plaintext)?;
                                            decrypted_files.push(payload.filename);
                                        }
                                    }
                                }
                            },
                            Err(e) => {
                                eprintln!("WARNING: Metadata integrity check failed");
                                eprintln!("Possible tampering detected! Error: {}", e);
                            }
                        }
                    },
                    Err(_) => {}
                }
            }
        }
    }

    meta.last_verified_time = server_time;
    fs::write(meta_path, serde_json::to_vec_pretty(&meta)?)?;

    fek_arr.zeroize();

    Ok(format!("Decrypted files: {:?}", decrypted_files))
}

pub fn get_status_with_password(vault_path: String, password: String) -> Result<Vec<serde_json::Value>> {
    let vault_path_buf = Path::new(&vault_path);
    let meta_path = vault_meta_path(vault_path_buf);
    let meta_raw = fs::read(&meta_path)?;
    let meta: VaultMetadata = serde_json::from_slice(&meta_raw)?;

    // Derive FEK from password
    let salt = general_purpose::STANDARD.decode(&meta.salt_b64)?;
    let derived = derive_key(&password, &salt, meta.argon_mem_kib, meta.argon_iters, meta.argon_parallelism)?;
    let wrapped = general_purpose::STANDARD.decode(&meta.wrapped_fek_b64)?;
    let wrap_nonce = general_purpose::STANDARD.decode(&meta.wrap_nonce_b64)?;
    let fek = XChaCha20Poly1305::new(Key::from_slice(&derived))
        .decrypt(XNonce::from_slice(&wrap_nonce), wrapped.as_ref())
        .map_err(|_| anyhow!("Invalid password"))?;

    let mut fek_arr = [0u8; 32];
    fek_arr.copy_from_slice(&fek[0..32]);

    let fm_dir = files_meta_dir(vault_path_buf);
    let mut results = vec![];
    let mut tampering_warnings = vec![];

    if fm_dir.exists() {
        for entry in fs::read_dir(fm_dir)? {
            let path = entry?.path();
            if path.is_file() {
                let raw = fs::read(&path)?;
                match serde_json::from_slice::<EncryptedFileMeta>(&raw) {
                    Ok(encrypted_meta) => {
                        // Decrypt metadata
                        match decrypt_file_metadata(&fek_arr, &encrypted_meta.encrypted_payload_b64, &encrypted_meta.metadata_nonce_b64) {
                            Ok(payload) => {
                                // Return in frontend-compatible format
                                results.push(serde_json::json!({
                                    "filename": payload.filename,
                                    "file_unlock_date": payload.file_unlock_date,
                                    "nonce_b64": payload.nonce_b64,
                                    "ciphertext_b64": payload.ciphertext_b64,
                                }));
                            },
                            Err(e) => {
                                let warning_msg = format!("WARNING: Metadata decryption failed for file: {:?}", path.file_name());
                                eprintln!("{}", warning_msg);
                                eprintln!("Possible tampering detected! Error: {}", e);
                                tampering_warnings.push(warning_msg);
                                tampering_warnings.push(format!("Error: Metadata decryption failed - Possible tampering detected!"));
                            }
                        }
                    },
                    Err(e) => {
                        let warning_msg = format!("WARNING: Invalid metadata format: {:?} - {}", path.file_name(), e);
                        eprintln!("{}", warning_msg);
                        tampering_warnings.push(warning_msg);
                    }
                }
            }
        }
    }

    // Add tampering warnings to results if any were detected
    if !tampering_warnings.is_empty() {
        results.push(serde_json::json!({
            "_tampering_warnings": tampering_warnings
        }));
    }

    fek_arr.zeroize();
    Ok(results)
}

pub fn verify_password(vault_dir: String, password: String) -> Result<()> {
    let vault_path = Path::new(&vault_dir);
    let meta_path = vault_meta_path(vault_path);
    let meta_raw = fs::read(&meta_path)?;
    let meta: VaultMetadata = serde_json::from_slice(&meta_raw)?;

    let salt = general_purpose::STANDARD.decode(&meta.salt_b64).map_err(|e| anyhow!(e.to_string()))?;
    let derived = derive_key(&password, &salt, meta.argon_mem_kib, meta.argon_iters, meta.argon_parallelism)?;
    let wrapped = general_purpose::STANDARD.decode(&meta.wrapped_fek_b64).map_err(|e| anyhow!(e.to_string()))?;
    let wrap_nonce = general_purpose::STANDARD.decode(&meta.wrap_nonce_b64).map_err(|e| anyhow!(e.to_string()))?;
    
    let aead = XChaCha20Poly1305::new(Key::from_slice(&derived));
    let _fek = aead.decrypt(XNonce::from_slice(&wrap_nonce), wrapped.as_ref())
        .map_err(|_| anyhow!("Invalid password. Please check your password and try again."))?;
    
    Ok(())
}

#[tauri::command]
pub fn verify_vault_password(#[allow(non_snake_case)] vaultDir: String, password: String) -> Result<(), String> {
    verify_password(vaultDir, password).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn init_vault_tauri(#[allow(non_snake_case)] vaultDir: String, password: String, #[allow(non_snake_case)] vaultUnlockDate: u64) -> Result<(), String> {
    init_vault(vaultDir, password, vaultUnlockDate).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_file_tauri(#[allow(non_snake_case)] vaultDir: String, #[allow(non_snake_case)] filePath: String, password: String, #[allow(non_snake_case)] fileUnlockDate: u64) -> Result<(), String> {
    add_file(vaultDir, filePath, password, fileUnlockDate).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_file_with_custom_name(#[allow(non_snake_case)] vaultDir: String, #[allow(non_snake_case)] filePath: String, password: String, #[allow(non_snake_case)] fileUnlockDate: u64, #[allow(non_snake_case)] customFilename: String) -> Result<(), String> {
    add_file_with_name(vaultDir, filePath, password, fileUnlockDate, Some(customFilename)).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn unlock_vault_tauri(#[allow(non_snake_case)] vaultDir: String, #[allow(non_snake_case)] outDir: String, password: String) -> Result<String, String> {
    unlock_vault(vaultDir, outDir, password).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn status_with_password(#[allow(non_snake_case)] vaultPath: String, password: String) -> Result<Vec<serde_json::Value>, String> {
    get_status_with_password(vaultPath, password).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn vault_info(#[allow(non_snake_case)] vaultDir: String) -> Result<serde_json::Value, String> {
    let vault_path = Path::new(&vaultDir);
    let meta_path = vault_meta_path(vault_path);
    
    if !meta_path.exists() {
        return Ok(serde_json::Value::Null);
    }
    
    let meta_raw = fs::read(&meta_path).map_err(|e| e.to_string())?;
    let meta: VaultMetadata = serde_json::from_slice(&meta_raw).map_err(|e| e.to_string())?;
    
    let info = serde_json::json!({
        "created": meta.creation_ts,
        "last_server_time": meta.last_verified_time
    });
    
    Ok(info)
}

#[tauri::command]
pub async fn refresh_server_time(#[allow(non_snake_case)] vaultDir: String) -> Result<serde_json::Value, String> {
    let vault_path = Path::new(&vaultDir);
    let meta_path = vault_meta_path(vault_path);
    
    if !meta_path.exists() {
        return Err("Vault metadata not found".to_string());
    }
    
    let meta_raw = fs::read(&meta_path).map_err(|e| e.to_string())?;
    let mut meta: VaultMetadata = serde_json::from_slice(&meta_raw).map_err(|e| e.to_string())?;
        
    let (server_time, source) = fetch_public_unixtime_with_retries().await.map_err(|e| e.to_string())?;
    
    if meta.last_verified_time != 0 && server_time < meta.last_verified_time {
        return Err("Public time regression detected - possible attack".to_string());
    }
    
    meta.last_verified_time = server_time;
    fs::write(&meta_path, serde_json::to_vec_pretty(&meta).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;
    
    let info = serde_json::json!({
        "created": meta.creation_ts,
        "last_server_time": meta.last_verified_time,
        "time_source": source
    });
    
    Ok(info)
}