export enum AuthType {
  CODE_PKCE = "code_pkce",
  CODE_SECRET = "code_secret",
  CODE_SECRET_PKCE = "code_secret_pkce",
  IMPLICIT = "implicit",
}

export type FieldType = {
  auth_type: AuthType;
  verifier?: string;
  challenge?: string;
  url: string;
  clientId: string;
  redirectUrl: string;
  scope: string[];
  responseType: string;
  nonce?: string;
  state?: string;
};
export enum Steps {
  WAIT = "wait",
  PROCESS = "process",
  FINISH = "finish",
}
export type StepsList = { 1: Steps; 2: Steps; 3: Steps };

export interface TokenResponse {
  token_type: "Bearer";
  expires_in: number;
  scope: "openid" | "profile" | "email";
  access_token: string;
  id_token: string;
}
