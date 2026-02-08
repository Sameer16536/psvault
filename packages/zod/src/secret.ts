import { z } from "zod";

// ============================================
// Secret Schemas
// ============================================

export const ZSecretType = z.enum(["password", "note", "api_key", "card"]);

export const ZSecretMetadata = z.object({
    title: z.string().min(1).max(200),
    domain: z.string().max(255).optional(),
    tags: z.array(z.string()).optional(),
});

export const ZCreateSecretRequest = z.object({
    vaultId: z.string().uuid(),
    type: ZSecretType,
    encryptedPayload: z.string(), // Base64 encoded
    encryptionVersion: z.number().int().min(1),
    metadata: ZSecretMetadata,
});

export const ZUpdateSecretRequest = z.object({
    encryptedPayload: z.string().optional(),
    encryptionVersion: z.number().int().min(1).optional(),
    metadata: ZSecretMetadata.optional(),
});

export const ZSearchSecretsRequest = z.object({
    vaultId: z.string().uuid().optional(),
    type: ZSecretType.optional(),
    title: z.string().optional(),
    domain: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export const ZSecretResponse = z.object({
    id: z.string().uuid(),
    vaultId: z.string().uuid(),
    type: ZSecretType,
    encryptedPayload: z.string(),
    encryptionVersion: z.number().int(),
    metadata: ZSecretMetadata,
    lastAccessedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type SecretType = z.infer<typeof ZSecretType>;
export type SecretMetadata = z.infer<typeof ZSecretMetadata>;
export type CreateSecretRequest = z.infer<typeof ZCreateSecretRequest>;
export type UpdateSecretRequest = z.infer<typeof ZUpdateSecretRequest>;
export type SearchSecretsRequest = z.infer<typeof ZSearchSecretsRequest>;
export type SecretResponse = z.infer<typeof ZSecretResponse>;
