import React, { useEffect, useState } from "react";
import { Button, Card, Input, Space, Form, Collapse } from "antd";
import { AuthType, Steps, StepsList, TokenResponse } from "../types/authTypes";
import { useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface AuthorisePayload {
  grant_type: "authorization_code";
  client_id: string | null;
  redirect_uri: string | null;
  code: string | null;
  code_verifier?: string | null;
  client_secret?: string | null;
}

const { Panel } = Collapse;
const { Item: FormItem } = Form;

interface TokenFetcherProps {
  steps: StepsList;
  setTokenResponse: (res: TokenResponse) => void;
  setSteps: (step: StepsList) => void;
  setAccessToken: (accessToken: string) => void;
  setIdToken: (idToken: string) => void;
  clear: () => void;
}

const TokenFetcher: React.FC<TokenFetcherProps> = ({
  steps,
  setTokenResponse,
  setSteps,
  setAccessToken,
  setIdToken,
  clear,
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setCode(searchParams.get("code"));
  }, [searchParams]);

  const requiresSecret =
    sessionStorage.getItem("auth_type") === AuthType.CODE_SECRET ||
    sessionStorage.getItem("auth_type") === AuthType.CODE_SECRET_PKCE;

  const stateParam = searchParams.get("state");

  const fetchTokens = async (
    payload: AuthorisePayload,
    url: string,
    headers: Headers
  ) => {
    const formBody = Object.keys(payload)
      .map(
        (key) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`
      )
      .join("&");

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formBody,
      });

      const tokens = await response.json();
      return tokens;
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };

  const fetchTokensBrowser = async () => {
    const verifier = sessionStorage.getItem("verifier");
    const clientId = sessionStorage.getItem("clientId");
    const redirectUrl = sessionStorage.getItem("redirect_uri");
    const url = `${sessionStorage.getItem("url")}/oauth2/v1/token`;
    const authType = sessionStorage.getItem("auth_type");

    const headers = new Headers({
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
    });

    let payload: AuthorisePayload = {
      grant_type: "authorization_code",
      client_id: clientId,
      redirect_uri: redirectUrl,
      code,
    };

    if (authType === AuthType.CODE_PKCE) {
      payload = { ...payload, code_verifier: verifier };
    } else if (authType === AuthType.CODE_SECRET) {
      payload = { ...payload, client_secret: clientSecret };
    } else if (authType === AuthType.CODE_SECRET_PKCE) {
      payload = {
        ...payload,
        code_verifier: verifier,
        client_secret: clientSecret,
      };
    } else {
      console.log("Auth type not found");
      return;
    }

    const tokens = await fetchTokens(payload, url, headers);

    if (tokens) {
      handleTokenResponse(tokens);
    }

    // Clear code and state params
    searchParams.delete("code");
    searchParams.delete("state");
    setSearchParams(searchParams);
  };

  const fetchTokensServer = async () => {
    const codeVerifier = sessionStorage.getItem("verifier");
    const clientId = sessionStorage.getItem("clientId");
    const redirectUrl = sessionStorage.getItem("redirect_uri");
    const baseUrl = sessionStorage.getItem("url");
    const authType = sessionStorage.getItem("auth_type");

    const payload = {
      code,
      codeVerifier,
      clientId,
      clientSecret,
      redirectUrl,
      baseUrl,
    };

    if (authType === AuthType.CODE_SECRET) {
      delete payload.codeVerifier;
    }

    try {
      const response = await fetch("http://localhost:3004/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const tokens = await response.json();
      handleTokenResponse(tokens);
    } catch (error) {
      console.error("Error fetching tokens from server:", error);
    }
  };

  const handleTokenResponse = (tokens: TokenResponse) => {
    setTokenResponse(tokens);
    const { id_token, access_token } = tokens;
    setIdToken(id_token);
    setAccessToken(access_token);

    const updatedSteps: StepsList = {
      ...steps,
      2: Steps.FINISH,
      3: Steps.PROCESS,
    };
    setSteps(updatedSteps);

    const decodedIdToken = jwtDecode(id_token);
    console.log("Decoded ID token:", decodedIdToken);

    // Clear session data
    sessionStorage.clear();
  };
  const getRequestHeaders = () => {
    if (requiresSecret) {
      return (
        <p>
          {`Headers: {
        "Content-Type": "application/x-www-form-urlencoded" 
        "Authorization": "Basic base64(username:password)"
      }`}
        </p>
      );
    } else {
      <p>
        {`Headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }`}
      </p>;
    }
  };

  return (
    <Collapse
      activeKey={steps[2] === "process" ? "2" : "0"}
      style={{ width: "100%" }}
    >
      <Panel header="Request tokens" key="2">
        <Card>
          <h4>Callback parameters</h4>
          <p>Grant code: {code}</p>
          <p>State: {stateParam}</p>
        </Card>
        <Card>
          <h4>{`POST: ${sessionStorage.getItem("url")}/oauth2/v1/token`}</h4>
          {getRequestHeaders()}
          <p>grant_type: authorization_code</p>
          {!requiresSecret && (
            <p>client_id: {sessionStorage.getItem("clientId")}</p>
          )}
          <p>redirect_uri: {sessionStorage.getItem("redirect_uri")}</p>
          <p>code: {code}</p>
          <p>code_verifier: {sessionStorage.getItem("verifier")}</p>
          {requiresSecret && (
            <FormItem label="Client secret" style={{ maxWidth: 600 }}>
              <Input
                value={clientSecret || ""}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </FormItem>
          )}
          <Space style={{ width: "100%" }}>
            <Button
              type="primary"
              onClick={requiresSecret ? fetchTokensServer : fetchTokensBrowser}
              disabled={requiresSecret && !clientSecret}
            >
              Get tokens
            </Button>
          </Space>
          <Button onClick={clear} style={{ marginTop: "20px" }}>
            Clear
          </Button>
        </Card>
      </Panel>
    </Collapse>
  );
};

export default TokenFetcher;
