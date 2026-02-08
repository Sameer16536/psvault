import { initContract, type AppRouter } from "@ts-rest/core";
import { healthContract } from "./health.js";
import { vaultContract } from "./vault.js";
import { secretContract } from "./secret.js";
import { deviceContract } from "./device.js";

const c = initContract();

export const apiContract: AppRouter = c.router({
  Health: healthContract,
  Vault: vaultContract,
  Secret: secretContract,
  Device: deviceContract,
});
