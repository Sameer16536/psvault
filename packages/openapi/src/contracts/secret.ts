import { initContract, type AppRouter } from "@ts-rest/core";
import {
    ZCreateSecretRequest,
    ZUpdateSecretRequest,
    ZSecretResponse,
    ZSearchSecretsRequest,
} from "@boilerplate/zod";
import { getSecurityMetadata } from "@/utils.js";

const c = initContract();

export const secretContract: AppRouter = c.router(
    {
        createSecret: {
            summary: "Create Secret",
            path: "/api/secrets",
            method: "POST",
            description: "Create a new encrypted secret",
            body: ZCreateSecretRequest,
            responses: {
                201: ZSecretResponse,
            },
            metadata: getSecurityMetadata(),
        },
        searchSecrets: {
            summary: "Search Secrets",
            path: "/api/secrets/search",
            method: "GET",
            description: "Search secrets with filters",
            query: ZSearchSecretsRequest,
            responses: {
                200: ZSecretResponse.array(),
            },
            metadata: getSecurityMetadata(),
        },
        getSecret: {
            summary: "Get Secret",
            path: "/api/secrets/:id",
            method: "GET",
            description: "Get a specific secret by ID (updates lastAccessedAt)",
            pathParams: c.type<{ id: string }>(),
            responses: {
                200: ZSecretResponse,
            },
            metadata: getSecurityMetadata(),
        },
        updateSecret: {
            summary: "Update Secret",
            path: "/api/secrets/:id",
            method: "PUT",
            description: "Update secret data and/or metadata",
            pathParams: c.type<{ id: string }>(),
            body: ZUpdateSecretRequest,
            responses: {
                200: ZSecretResponse,
            },
            metadata: getSecurityMetadata(),
        },
        deleteSecret: {
            summary: "Delete Secret",
            path: "/api/secrets/:id",
            method: "DELETE",
            description: "Delete a secret permanently",
            pathParams: c.type<{ id: string }>(),
            body: c.type<{}>(),
            responses: {
                204: c.type<void>(),
            },
            metadata: getSecurityMetadata(),
        },
        listVaultSecrets: {
            summary: "List Vault Secrets",
            path: "/api/vaults/:vaultId/secrets",
            method: "GET",
            description: "Get all secrets in a specific vault",
            pathParams: c.type<{ vaultId: string }>(),
            responses: {
                200: ZSecretResponse.array(),
            },
            metadata: getSecurityMetadata(),
        },
    },
    {
        pathPrefix: "",
    }
);
