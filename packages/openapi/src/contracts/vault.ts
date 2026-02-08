import { initContract } from "@ts-rest/core";
import {
    ZCreateVaultRequest,
    ZUpdateVaultRequest,
    ZVaultResponse,
} from "@boilerplate/zod";
import { getSecurityMetadata } from "@/utils.js";

const c = initContract();

export const vaultContract = c.router(
    {
        createVault: {
            summary: "Create Vault",
            path: "/api/vaults",
            method: "POST",
            description: "Create a new password vault",
            body: ZCreateVaultRequest,
            responses: {
                201: ZVaultResponse,
            },
            metadata: getSecurityMetadata(),
        },
        listVaults: {
            summary: "List Vaults",
            path: "/api/vaults",
            method: "GET",
            description: "Get all vaults for the authenticated user",
            responses: {
                200: ZVaultResponse.array(),
            },
            metadata: getSecurityMetadata(),
        },
        getVault: {
            summary: "Get Vault",
            path: "/api/vaults/:id",
            method: "GET",
            description: "Get a specific vault by ID",
            pathParams: c.type<{ id: string }>(),
            responses: {
                200: ZVaultResponse,
            },
            metadata: getSecurityMetadata(),
        },
        updateVault: {
            summary: "Update Vault",
            path: "/api/vaults/:id",
            method: "PUT",
            description: "Update vault details",
            pathParams: c.type<{ id: string }>(),
            body: ZUpdateVaultRequest,
            responses: {
                200: ZVaultResponse,
            },
            metadata: getSecurityMetadata(),
        },
        deleteVault: {
            summary: "Delete Vault",
            path: "/api/vaults/:id",
            method: "DELETE",
            description: "Delete a vault and all its secrets",
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
