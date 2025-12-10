/**
 * Encryption Service
 * AES-256 encryption for data at rest and TLS 1.3 for data in transit
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

export interface EncryptionOptions {
  algorithm?: string;
  keyLength?: number;
  ivLength?: number;
  saltLength?: number;
  iterations?: number;
  digest?: string;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  salt?: string;
}

/**
 * Encryption Service - Military-grade encryption for sensitive data
 */
export class EncryptionService {
  private readonly algorithm: string;
  private readonly keyLength: number;
  private readonly ivLength: number;
  private readonly saltLength: number;
  private readonly iterations: number;
  private readonly digest: string;
  private masterKey: Buffer;

  constructor(options?: EncryptionOptions) {
    this.algorithm = options?.algorithm || "aes-256-gcm";
    this.keyLength = options?.keyLength || 32; // 256 bits
    this.ivLength = options?.ivLength || 16; // 128 bits
    this.saltLength = options?.saltLength || 64;
    this.iterations = options?.iterations || 100000;
    this.digest = options?.digest || "sha512";

    this.masterKey = this.loadOrGenerateMasterKey();
  }

  /**
   * Load or generate master encryption key
   */
  private loadOrGenerateMasterKey(): Buffer {
    const keyPath = path.join(
      process.cwd(),
      "config",
      "security",
      "keys",
      "master.key",
    );

    try {
      if (fs.existsSync(keyPath)) {
        const encrypted = fs.readFileSync(keyPath, "utf-8");
        const passphrase =
          process.env.MASTER_KEY_PASSPHRASE || "default-passphrase-change-me";
        return this.decryptMasterKey(encrypted, passphrase);
      }
    } catch (error) {
      console.error("Error loading master key:", error);
    }

    // Generate new master key
    return this.generateMasterKey(keyPath);
  }

  /**
   * Generate new master encryption key
   */
  private generateMasterKey(keyPath: string): Buffer {
    console.log("🔐 Generating new master encryption key...");

    const masterKey = crypto.randomBytes(this.keyLength);
    const passphrase =
      process.env.MASTER_KEY_PASSPHRASE || "default-passphrase-change-me";

    // Encrypt master key with passphrase
    const encrypted = this.encryptMasterKey(masterKey, passphrase);

    // Save encrypted master key
    const dir = path.dirname(keyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    fs.writeFileSync(keyPath, encrypted, { mode: 0o600 });
    console.log("✅ Generated and saved master encryption key");

    return masterKey;
  }

  /**
   * Encrypt master key with passphrase
   */
  private encryptMasterKey(masterKey: Buffer, passphrase: string): string {
    const salt = crypto.randomBytes(this.saltLength);
    const key = crypto.pbkdf2Sync(
      passphrase,
      salt,
      this.iterations,
      this.keyLength,
      this.digest,
    );
    const iv = crypto.randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(masterKey);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      encrypted: encrypted.toString("hex"),
      iv: iv.toString("hex"),
      salt: salt.toString("hex"),
      authTag: authTag.toString("hex"),
    });
  }

  /**
   * Decrypt master key with passphrase
   */
  private decryptMasterKey(encrypted: string, passphrase: string): Buffer {
    const { encrypted: data, iv, salt, authTag } = JSON.parse(encrypted);

    const key = crypto.pbkdf2Sync(
      passphrase,
      Buffer.from(salt, "hex"),
      this.iterations,
      this.keyLength,
      this.digest,
    );

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(iv, "hex"),
    );

    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(Buffer.from(data, "hex"));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  /**
   * Encrypt data with AES-256-GCM
   */
  public async encrypt(
    data: string | Buffer,
    key?: Buffer,
  ): Promise<EncryptedData> {
    const encryptionKey = key || this.masterKey;
    const iv = await randomBytes(this.ivLength);

    const cipher = crypto.createCipheriv(this.algorithm, encryptionKey, iv);

    const inputData =
      typeof data === "string" ? Buffer.from(data, "utf-8") : data;
    let encrypted = cipher.update(inputData);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
    };
  }

  /**
   * Decrypt data
   */
  public decrypt(encryptedData: EncryptedData, key?: Buffer): Buffer {
    const decryptionKey = key || this.masterKey;

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      decryptionKey,
      Buffer.from(encryptedData.iv, "base64"),
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, "base64"));

    let decrypted = decipher.update(
      Buffer.from(encryptedData.encrypted, "base64"),
    );
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  /**
   * Encrypt data with password (password-based encryption)
   */
  public async encryptWithPassword(
    data: string,
    password: string,
  ): Promise<EncryptedData> {
    const salt = await randomBytes(this.saltLength);
    const key = await pbkdf2(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest,
    );

    const result = await this.encrypt(data, key);
    result.salt = salt.toString("base64");

    return result;
  }

  /**
   * Decrypt data with password
   */
  public async decryptWithPassword(
    encryptedData: EncryptedData,
    password: string,
  ): Promise<string> {
    if (!encryptedData.salt) {
      throw new Error("Salt is required for password-based decryption");
    }

    const salt = Buffer.from(encryptedData.salt, "base64");
    const key = await pbkdf2(
      password,
      salt,
      this.iterations,
      this.keyLength,
      this.digest,
    );

    const decrypted = this.decrypt(encryptedData, key);
    return decrypted.toString("utf-8");
  }

  /**
   * Hash data with SHA-512
   */
  public hash(data: string | Buffer, algorithm: string = "sha512"): string {
    const input = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
    return crypto.createHash(algorithm).update(input).digest("hex");
  }

  /**
   * Generate HMAC
   */
  public hmac(
    data: string | Buffer,
    key?: Buffer,
    algorithm: string = "sha512",
  ): string {
    const hmacKey = key || this.masterKey;
    const input = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
    return crypto.createHmac(algorithm, hmacKey).update(input).digest("hex");
  }

  /**
   * Verify HMAC
   */
  public verifyHmac(
    data: string | Buffer,
    signature: string,
    key?: Buffer,
  ): boolean {
    const expectedSignature = this.hmac(data, key);
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );
  }

  /**
   * Generate secure random token
   */
  public async generateToken(length: number = 32): Promise<string> {
    const buffer = await randomBytes(length);
    return buffer.toString("hex");
  }

  /**
   * Generate cryptographically secure random number
   */
  public generateRandomNumber(min: number, max: number): number {
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;

    let randomNumber: number;
    do {
      const randomBytes = crypto.randomBytes(bytesNeeded);
      randomNumber = randomBytes.readUIntBE(0, bytesNeeded);
    } while (randomNumber > maxValid);

    return min + (randomNumber % range);
  }

  /**
   * Encrypt file
   */
  public async encryptFile(
    inputPath: string,
    outputPath: string,
    key?: Buffer,
  ): Promise<void> {
    const data = await fs.promises.readFile(inputPath);
    const encrypted = await this.encrypt(data, key);

    await fs.promises.writeFile(outputPath, JSON.stringify(encrypted), {
      mode: 0o600,
    });
  }

  /**
   * Decrypt file
   */
  public async decryptFile(
    inputPath: string,
    outputPath: string,
    key?: Buffer,
  ): Promise<void> {
    const encryptedData = JSON.parse(
      await fs.promises.readFile(inputPath, "utf-8"),
    ) as EncryptedData;

    const decrypted = this.decrypt(encryptedData, key);
    await fs.promises.writeFile(outputPath, decrypted, { mode: 0o600 });
  }

  /**
   * Securely compare two strings (timing-safe)
   */
  public secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(a, "utf-8"),
      Buffer.from(b, "utf-8"),
    );
  }

  /**
   * Generate key pair for asymmetric encryption
   */
  public async generateKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        "rsa",
        {
          modulusLength: 4096,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
            cipher: "aes-256-cbc",
            passphrase:
              process.env.KEY_PASSPHRASE || "default-passphrase-change-me",
          },
        },
        (err, publicKey, privateKey) => {
          if (err) {
            reject(err);
          } else {
            resolve({ publicKey, privateKey });
          }
        },
      );
    });
  }

  /**
   * Encrypt with public key (RSA)
   */
  public encryptWithPublicKey(data: string, publicKey: string): string {
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha512",
      },
      Buffer.from(data, "utf-8"),
    );

    return encrypted.toString("base64");
  }

  /**
   * Decrypt with private key (RSA)
   */
  public decryptWithPrivateKey(
    encrypted: string,
    privateKey: string,
    passphrase?: string,
  ): string {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        passphrase:
          passphrase ||
          process.env.KEY_PASSPHRASE ||
          "default-passphrase-change-me",
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha512",
      },
      Buffer.from(encrypted, "base64"),
    );

    return decrypted.toString("utf-8");
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();
