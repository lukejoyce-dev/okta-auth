export interface ClientFieldType {
  verifier: string;
  challenge: string;
  url: string;
  clientId: string;
  redirectUrl: string;
  scope: string[];
  responseType: "code" | "token";
  nonce?: string;
  state?: string;
}

export interface OktaAccessToken {
  token_type?: string;
  expires_in?: number;
  access_token: string;
  scope?: string;
  id_token?: string;
}

export enum AuthType {
  CODE_PKCE = "code_pkce",
  CODE_SECRET = "code_secret",
  CODE_SECRET_PKCE = "code_secret_pkce",
  IMPLICIT = "implicit",
}
