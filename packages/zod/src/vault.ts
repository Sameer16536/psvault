import { z } from "zod";

// ============================================
// Vault Schemas
// ============================================

export const ZCreateVaultRequest = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const ZUpdateVaultRequest = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const ZVaultResponse = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateVaultRequest = z.infer<typeof ZCreateVaultRequest>;
export type UpdateVaultRequest = z.infer<typeof ZUpdateVaultRequest>;
export type VaultResponse = z.infer<typeof ZVaultResponse>;
