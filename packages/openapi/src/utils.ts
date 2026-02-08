import { match } from "ts-pattern";

export const getSecurityMetadata = ({
  security = true,
  securityType = "clerk",
}: {
  security?: boolean;
  securityType?: "clerk" | "service";
} = {}) => {
  const openApiSecurity = match(securityType)
    .with("clerk", () => [
      {
        clerkAuth: [],
      },
    ])
    .with("service", () => [
      {
        "x-service-token": [],
      },
    ])
    .exhaustive();

  return {
    ...(security && { openApiSecurity }),
  };
};
