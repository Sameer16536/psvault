import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);
import { generateOpenApi } from "@ts-rest/open-api";

import { apiContract } from "./contracts/index.js";

type SecurityRequirementObject = {
  [key: string]: string[];
};

export type OperationMapper = NonNullable<
  Parameters<typeof generateOpenApi>[2]
>["operationMapper"];

const hasSecurity = (
  metadata: unknown
): metadata is { openApiSecurity: SecurityRequirementObject[] } => {
  return (
    !!metadata && typeof metadata === "object" && "openApiSecurity" in metadata
  );
};

const operationMapper: OperationMapper = (operation, appRoute) => ({
  ...operation,
  ...(hasSecurity(appRoute.metadata)
    ? {
      security: appRoute.metadata.openApiSecurity,
    }
    : {}),
});

export const OpenAPI = Object.assign(
  generateOpenApi(
    apiContract,
    {
      openapi: "3.0.3",
      info: {
        version: "1.0.0",
        title: "PSVault API - Password Vault Backend",
        description: "Secure password vault backend with encrypted storage, Clerk authentication, and comprehensive audit logging.",
      },
      servers: [
        {
          url: "http://localhost:8080",
          description: "Local Development Server",
        },
        {
          url: "https://api.psvault.com",
          description: "Production Server",
        },
      ],
    },
    {
      operationMapper,
      setOperationId: true,
    }
  ),
  {
    components: {
      securitySchemes: {
        clerkAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Clerk session token obtained from Clerk authentication",
        },
      },
    },
  }
);
