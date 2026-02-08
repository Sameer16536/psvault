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
            salt: newSalt,
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
export async function encrypt(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
    );

    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
}

// Decrypt data
export async function decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedData
    );

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
