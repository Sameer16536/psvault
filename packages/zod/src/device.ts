import { z } from "zod";

// ============================================
// Device Schemas
// ============================================

export const ZRegisterDeviceRequest = z.object({
    deviceFingerprint: z.string().min(1).max(255),
});

export const ZDeviceResponse = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    deviceFingerprint: z.string(),
    lastSeenAt: z.string().datetime(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export type RegisterDeviceRequest = z.infer<typeof ZRegisterDeviceRequest>;
export type DeviceResponse = z.infer<typeof ZDeviceResponse>;
