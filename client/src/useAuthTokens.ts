import { useState } from "react";
import { AuthType } from "./constants";

export const useAuthTokens = (searchParams, setSearchParams) => {
  const [tokenResponse, setTokenResponse] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);

  const fetchTokensBrowser = async () => {
    const verifier = sessionStorage.getItem("verifier");
    const clientId = sessionStorage.getItem("clientId");
    const redirectUrl = sessionStorage.getItem("redirect_uri");
    const url = sessionStorage.getItem("url");
    const authType = sessionStorage.getItem("auth_type");

    let payload = {
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUrl,
      code: searchParams.get("code"),
      code_verifier: verifier,
    };

    if (authType === AuthType.CODE_SECRET) {
      payload = {
        ...payload,
        clientSecret,
      };
    }

    if (authType === AuthType.CODE_SECRET_PKCE) {
      payload = {
        ...payload,
        clientSecret,
      };
    }

    const headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
      Connection: "keep-alive",
      Host: "api.example.com",
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    });

    const formBody = new URLSearchParams(payload).toString();

    const tokens = await fetch(`${url}/oauth2/v1/token`, {
      method: "POST",
      headers,
      body: formBody,
    }).then((res) => res.json());

    if (tokens) {
      setTokenResponse(tokens);
      setIdToken(tokens.id_token);
      setAccessToken(tokens.access_token);
      sessionStorage.clear();
      searchParams.delete("code");
      searchParams.delete("state");
      setSearchParams(searchParams);
    }
  };

  return {
    tokenResponse,
    idToken,
    accessToken,
    clientSecret,
    setClientSecret,
    fetchTokensBrowser,
  };
};
