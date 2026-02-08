import { initContract, type AppRouter } from "@ts-rest/core";
import {
    ZRegisterDeviceRequest,
    ZDeviceResponse,
} from "@boilerplate/zod";
import { getSecurityMetadata } from "@/utils.js";

const c = initContract();

export const deviceContract: AppRouter = c.router(
    {
        registerDevice: {
            summary: "Register Device",
            path: "/api/devices",
            method: "POST",
            description: "Register a new device or update last seen time",
            body: ZRegisterDeviceRequest,
            responses: {
                201: ZDeviceResponse,
            },
            metadata: getSecurityMetadata(),
        },
        listDevices: {
            summary: "List Devices",
            path: "/api/devices",
            method: "GET",
            description: "Get all registered devices for the user",
            responses: {
                200: ZDeviceResponse.array(),
            },
            metadata: getSecurityMetadata(),
        },
        deleteDevice: {
            summary: "Delete Device",
            path: "/api/devices/:id",
            method: "DELETE",
            description: "Remove a registered device",
            pathParams: c.type<{ id: string }>(),
            body: c.type<{}>(),
            responses: {
                204: c.type<void>(),
            },
            metadata: getSecurityMetadata(),
        },
    },
    {
        pathPrefix: "",
    }
);
