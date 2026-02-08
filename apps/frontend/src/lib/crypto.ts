// Encryption utilities using Web Crypto API

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

// Derive encryption key from master password
export async function deriveKey(masterPassword: string, salt?: Uint8Array): Promise<{ key: CryptoKey; salt: Uint8Array }> {
    const newSalt = salt || crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

    const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(masterPassword),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: newSalt as any,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );

    return { key, salt: newSalt };
}

// Encrypt data
export async function encrypt(data: string | Uint8Array, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedData = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;

    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData as any
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
}

// Decrypt data to Uint8Array
export async function decryptRaw(encryptedBase64: string, key: CryptoKey): Promise<Uint8Array> {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
    );

    return new Uint8Array(decryptedData);
}

// Decrypt data to string
export async function decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
    const decryptedData = await decryptRaw(encryptedBase64, key);
    return new TextDecoder().decode(decryptedData);
}

// Generate secure password
export function generatePassword(length = 16, options = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
}): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (options.uppercase) chars += uppercase;
    if (options.lowercase) chars += lowercase;
    if (options.numbers) chars += numbers;
    if (options.symbols) chars += symbols;

    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    return Array.from(array, byte => chars[byte % chars.length]).join('');
}

// Generate a random vault key
export async function generateVaultKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true, // extractable
        ['encrypt', 'decrypt']
    );
}

// Export vault key to raw bytes
export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await crypto.subtle.exportKey('raw', key);
}

// Import vault key from raw bytes
export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Encrypt vault key with master password
export async function encryptVaultKey(vaultKey: CryptoKey, masterPassword: string): Promise<string> {
    // 1. Export vault key to raw bytes
    const exportedKey = await exportKey(vaultKey);

    // 2. Derive key from master password
    const { key: masterKey, salt } = await deriveKey(masterPassword);

    // 3. Encrypt exported key (as Uint8Array). encrypt returns Base64(IV + Cipher)
    const encryptedBase64 = await encrypt(new Uint8Array(exportedKey), masterKey);

    // 4. Decode to bytes to combine with salt
    const encryptedBytes = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // 5. Combine Salt + EncryptedBytes (IV + Cipher)
    const finalBytes = new Uint8Array(salt.length + encryptedBytes.length);
    finalBytes.set(salt, 0);
    finalBytes.set(encryptedBytes, salt.length);

    // 6. Return as Base64
    return btoa(String.fromCharCode(...finalBytes));
}

// Decrypt vault key with master password
export async function decryptVaultKey(encryptedBase64: string, masterPassword: string): Promise<CryptoKey> {
    // 1. Decode Base64 to bytes
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // 2. Extract Salt
    const salt = combined.slice(0, SALT_LENGTH);
    const encryptedBytes = combined.slice(SALT_LENGTH); // Contains IV + Cipher

    // 3. Derive key using the extracted salt
    const { key: masterKey } = await deriveKey(masterPassword, salt);

    // 4. Re-encode encrypted data to Base64 for decryptRaw
    const encryptedBytesBase64 = btoa(String.fromCharCode(...encryptedBytes));

    // 5. Decrypt to raw bytes
    const decryptedBytes = await decryptRaw(encryptedBytesBase64, masterKey);

    // 6. Import as CryptoKey
    return await importKey(decryptedBytes.buffer as ArrayBuffer);
}
