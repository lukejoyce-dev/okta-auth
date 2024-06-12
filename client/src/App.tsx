import pkceChallenge from "pkce-challenge";
import {
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Tabs,
  TabsProps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { jwtDecode } from "jwt-decode";
import { CopyBlock, dracula } from "react-code-blocks";
import FormItem from "antd/es/form/FormItem";

import { nanoid } from "nanoid";
import { useNavigate } from "react-router-dom";
const { Paragraph } = Typography;
const { Panel } = Collapse;
// The state is given back by the OAuth2 server in the redirected url, so the client app can verify that the request to open the authorization page was indeed triggered by itself.

type ClientFieldType = {
  verifier: string;
  challenge: string;
  url: string;
  clientId: string;
  redirectUrl: string;
  scope: "openId" | "profile" | "email";
  responseType: "code" | "token";
  nonce?: string;
  state?: string;
};

type OktaAccessToken = {
  token_type?: string;
  expires_in?: number;
  access_token: string;
  scope?: "openid";
  id_token?: string;
};

export enum AuthType {
  CODE_PKCE = "code_pkce",
  CODE_SECRET = "code_secret",
  CODE_SECRET_PKCE = "code_secret_pkce",
  IMPLICIT = "implicit",
}

const authorise = async (
  _authType: AuthType,
  _client_id: string,
  _redirect_uri: string,
  _scope: string[],
  _url: string,
  _code_challenge?: String,
  _code_verifier?: string,
  _nonce?: string,
  _state?: string
) => {
  // To save data to sessionStorage
  sessionStorage.setItem("auth_type", _authType);
  sessionStorage.setItem("clientId", _client_id);
  sessionStorage.setItem("redirect_uri", _redirect_uri);
  sessionStorage.setItem("url", _url);
  if (_code_verifier) sessionStorage.setItem("verifier", _code_verifier);
  const client_id = `client_id=${_client_id}`;
  const code_challenge = `code_challenge=${_code_challenge}`;
  const code_challenge_method = "code_challenge_method=s256";
  const redirect_uri = `redirect_uri=${_redirect_uri}`;
  const scope = `scope=${_scope.join("%20")}`;
  const state = `state=${_state}`;
  const response_type =
    _authType === AuthType.IMPLICIT
      ? "response_type=token"
      : "response_type=code"; //response types: [code, id_token, token].

  let url = `${_url}/oauth2/v1/authorize?${client_id}&${redirect_uri}&${scope}&${response_type}`;
  // Add nonce if implicit flow. Ensure that the ID token received by the client is fresh and not a replay of a previously received token.

  if (_nonce) {
    url = `${url}&nonce=${_nonce}`;
  }
  // Add PKCE values if required
  if (_code_challenge && _code_verifier) {
    url = `${url}&${code_challenge}&${code_challenge_method}`;
  }
  // Add state (optional)
  url = `${url}&${state}`;

  window.location.href = url;
};

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tokenResponse, setTokenResponse] = useState<any>(null);
  const [token, setToken] = useState<OktaAccessToken | null>(null);
  const [idToken, setIdToken] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<any>(null);
  const [verifier, setVerifier] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  //const [authType, setAuthType] = useState<AuthType>(AuthType.CODE_PKCE);
  const [displayDecodedTokens, setDisplayDecodedTokens] =
    useState<boolean>(false);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const implicitAccessToken = searchParams.get("access_token");
  const { Option } = Select;
  const [configForm] = Form.useForm();
  Form.useWatch("clientId", configForm);
  const authType = Form.useWatch("auth_type", configForm);
  const challenge = Form.useWatch("challenge", configForm);
  const clientId = Form.useWatch("clientId", configForm);
  const redirectUrl = Form.useWatch("redirectUrl", configForm);
  const scope = Form.useWatch("scope", configForm);
  const responseType = Form.useWatch("responseType", configForm);
  const url = Form.useWatch("url", configForm);
  const state = Form.useWatch("state", configForm);
  const configValues = Form.useWatch([], configForm);
  const navigate = useNavigate();
  // Store the verifier
  if (verifier) {
    window.localStorage.setItem("code_verifier", verifier);
  }
  const clearUrlParams = () => {
    // Navigate to the base URL
    navigate("/");
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    setAccessToken(null);
    clearUrlParams();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setAccessToken(null);
    clearUrlParams();
  };

  const onClientFinish = (values: ClientFieldType) => {
    const {
      verifier,
      challenge,
      url,
      clientId,
      redirectUrl,
      scope,
      responseType,
      nonce,
      state,
    } = values;

    authorise(
      configForm.getFieldValue("auth_type"),
      clientId,
      redirectUrl,
      scope,
      url,
      challenge,
      verifier,
      nonce,
      state
    );
    console.log("Success:", values);
  };

  const fetchTokensBrowser = async () => {
    const verifier = sessionStorage.getItem("verifier");
    const clientId = sessionStorage.getItem("clientId");
    const redirectUrl = sessionStorage.getItem("redirect_uri");
    const url = sessionStorage.getItem("url");
    const authType = sessionStorage.getItem("auth_type");
    const headers = new Headers();
    let payload = {};
    headers.set(
      "Content-Type",
      "application/x-www-form-urlencoded;charset=UTF-8"
    );
    headers.set("Accept", "application/json");
    headers.set("Connection", "keep-alive");
    headers.set("Host", "api.example.com");
    headers.set(
      "User-Agent",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    );

    if (authType === AuthType.CODE_PKCE) {
      payload = {
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUrl,
        code: code,
        code_verifier: verifier,
      };
    }

    if (authType === AuthType.CODE_SECRET) {
      payload = {
        grant_type: "authorization_code",
        redirect_uri: redirectUrl,
        code: code,
        clientId: clientId,
        clientSecret: clientSecret,
      };
    }
    if (authType === AuthType.CODE_SECRET_PKCE) {
      payload = {
        grant_type: "authorization_code",
        redirect_uri: redirectUrl,
        code: code,
        code_verifier: verifier,
        clientId: clientId,
        clientSecret: clientSecret,
      };
    } else {
      console.log("Auth type not found");
    }
    let formBody: any = [];
    for (const property in payload) {
      const encodedKey = encodeURIComponent(property);
      //@ts-ignore
      const encodedValue = encodeURIComponent(payload[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    const tokens = await fetch(`${url}/oauth2/v1/token`, {
      method: "POST",
      headers: headers,
      body: formBody,
    })
      .then((res) => {
        console.log(res);
        return res.json();
      })
      .catch((err) => console.log(err));
    // Remove code grant
    searchParams.delete("code");
    searchParams.delete("state");
    setSearchParams(searchParams);
    // set token
    if (tokens) {
      setTokenResponse(tokens);
      const { id_token, access_token } = tokens;
      const updatedSteps = steps;
      updatedSteps[2] = "finish";
      updatedSteps[3] = "process";
      setSteps(updatedSteps);
      setIdToken(id_token);
      setAccessToken(access_token);
      const decodedIdToken = jwtDecode(id_token);
      console.log("decoded Id token", decodedIdToken);
      // Or clear all session data
      sessionStorage.clear();
    }
  };
  interface GetTokensPayload {
    code: string | null;
    codeVerifier?: string | null;
    clientId: string | null;
    clientSecret: string | null;
    baseUrl: string | null;
    redirectUrl: string | null;
  }
  const fetchTokensServer = async () => {
    //const code = 'TTmnvL8Qr81LCgwCwWR29QrnrzpaNtchLmn2J7de6po';
    const codeVerifier = sessionStorage.getItem("verifier");
    const clientId = sessionStorage.getItem("clientId");
    const redirectUrl = sessionStorage.getItem("redirect_uri");
    const baseUrl = sessionStorage.getItem("url");
    const authType = sessionStorage.getItem("auth_type");

    const payload: GetTokensPayload = {
      code,
      codeVerifier,
      clientId,
      clientSecret,
      redirectUrl,
      baseUrl,
    };
    // Remove codeVerifier if PKCE not enabled
    if (authType === AuthType.CODE_SECRET && payload.codeVerifier) {
      delete payload.codeVerifier;
    }

    try {
      const res = await fetch("http://localhost:3004/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      const { id_token, access_token } = result;
      setTokenResponse(result);
      setIdToken(id_token);
      setAccessToken(access_token);
      const updatedSteps = steps;
      updatedSteps[2] = "finish";
      updatedSteps[3] = "process";
      setSteps(updatedSteps);
    } catch (error) {
      console.error("Error:", error);
      //setResponse({ error: 'An error occurred' });
    }
  };

  const generatePkce = async () => {
    const pkce = await pkceChallenge();
    configForm.setFieldsValue({
      verifier: pkce.code_verifier,
      challenge: pkce.code_challenge,
    });
  };

  const defaultSteps = {
    1: "process",
    2: "wait",
    3: "wait",
    4: "wait",
    5: "wait",
  };
  const [steps, setSteps] = useState<any>(defaultSteps);

  if (tokenResponse) {
    console.log(
      "decoded id token converted to string",
      JSON.stringify(jwtDecode(idToken))
    );
  }

  const handleAuthTypeChange = (value: AuthType) => {
    sessionStorage.setItem("auth_type", value);
  };

  const clear = () => {
    setSteps(defaultSteps);
    configForm.resetFields();
    sessionStorage.clear();
    searchParams.delete("code");
    searchParams.delete("state");
    setSearchParams(searchParams);
  };
  const pkceInfo =
    "PKCE is short for Proof Key for Code Exchange. It is a mechanism that came into being to make the use of OAuth 2.0 Authorization Code grant more secure";
  console.log("authtype", authType);

  const renderCodeGrantPKCE = () => {
    console.log("Form render");
    const hidePKCE =
      authType === AuthType.CODE_SECRET || authType === AuthType.IMPLICIT
        ? true
        : false;
    const auth_type = sessionStorage.getItem("auth_type");
    const requiresSecret =
      auth_type === AuthType.CODE_SECRET ||
      auth_type === AuthType.CODE_SECRET_PKCE
        ? true
        : false;

    return (
      <>
        <p>
          This is a simple tool designed to test and enhance your understanding
          of four distinct Okta authentication flows. <br />
          The authentication flows include:
        </p>

        <p>
          #1 Code Grant with{" "}
          <Tooltip title={pkceInfo}>
            <u>PKCE</u>
          </Tooltip>
        </p>
        <p>#2 Code Grant with Client Secret</p>
        <p>
          #3 Code Grant with Client Secret and{" "}
          <Tooltip title={pkceInfo}>
            <u>PKCE</u>
          </Tooltip>
        </p>
        <p>#4 Implicit (Legacy)</p>

        <Steps
          direction="vertical"
          current={1}
          items={[
            {
              status: steps[1],
              //title: "Request access",
              description: (
                <div>
                  <Collapse
                    defaultActiveKey={["1"]}
                    style={{ width: "100%" }}
                    activeKey={steps[1] === "process" ? "1" : "0"}
                  >
                    <Panel header="Request access" key="1">
                      <Form
                        name="basic"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        style={{ maxWidth: 600 }}
                        initialValues={{ remember: true }}
                        onFinish={onClientFinish}
                        autoComplete="off"
                        form={configForm}
                        layout="vertical"
                      >
                        <FormItem label="Auth type" name="auth_type">
                          <Select
                            style={{ width: 300 }}
                            placeholder="Select auth type"
                            onChange={handleAuthTypeChange}
                            defaultValue={AuthType.CODE_PKCE}
                            options={[
                              {
                                value: AuthType.CODE_PKCE,
                                label: "Code grant + PKCE (browser)",
                              },
                              {
                                value: AuthType.CODE_SECRET,
                                label: "Code grant + client secret (server)",
                              },
                              {
                                value: AuthType.CODE_SECRET_PKCE,
                                label:
                                  "Code grant + client secret + PKCE (server)",
                              },
                              {
                                value: AuthType.IMPLICIT,
                                label: "Implicit (legacy)",
                              },
                            ]}
                          />
                        </FormItem>
                        <Form.Item<FieldType>
                          label="Code Verifier"
                          name="verifier"
                          hidden={hidePKCE}
                          rules={[
                            {
                              required: hidePKCE ? false : true,
                              message: "Please input your verifier",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item<FieldType>
                          label="Code Challenge"
                          name="challenge"
                          hidden={hidePKCE}
                          rules={[
                            {
                              required: hidePKCE ? false : true,
                              message: "Please input your challenge",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                        {!hidePKCE && (
                          <Button
                            style={{ marginBottom: "10px" }}
                            onClick={generatePkce}
                          >
                            Generate PKCE
                          </Button>
                        )}
                        <Form.Item<FieldType>
                          label="URL"
                          name="url"
                          tooltip="Example: https://dev-04146382.okta.com"
                          rules={[
                            {
                              required: true,
                              message: "Please input your okta URL",
                              type: "url",
                            },
                          ]}
                        >
                          <Input placeholder="https://<okta domain>" />
                        </Form.Item>
                        <Form.Item<FieldType>
                          label="Client Id"
                          name="clientId"
                          tooltip="Example: 0oaejhsmktYeayAe25d8"
                          rules={[
                            {
                              required: true,
                              message: "Please input your client Id",
                              type: "string",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item<FieldType>
                          label="Redirect URL"
                          name="redirectUrl"
                          rules={[
                            {
                              required: true,
                              message: "Please input your redirect URL",
                              type: "url",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name="scope"
                          label="Scope"
                          rules={[
                            {
                              required: true,
                              message: "Please select your scope",
                              type: "array",
                            },
                          ]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="Please select your scope"
                          >
                            <Option value="openid">OpenId</Option>
                            <Option value="profile">Profile</Option>
                            <Option value="email">Email</Option>
                            <Option value="phone">Phone</Option>
                            <Option value="address">Address</Option>
                            <Option value="groups">Groups</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name="responseType"
                          label="Response Type"
                          rules={[
                            {
                              required: true,
                              message: "Please select your response type",
                            },
                          ]}
                        >
                          <Select
                            placeholder="Please select your response type"
                            disabled={true}
                          >
                            <Option value="code">Code</Option>
                            <Option value="token">Token</Option>
                          </Select>
                        </Form.Item>

                        {authType === AuthType.IMPLICIT && (
                          <>
                            <Form.Item<FieldType>
                              label="Nonce"
                              name="nonce"
                              tooltip="Ensures that the ID token received by the client is fresh and not a replay of a previously received token"
                              rules={[
                                {
                                  required: true,
                                  message: "Please input your nonce value",
                                  type: "string",
                                },
                              ]}
                            >
                              <Input />
                            </Form.Item>
                            <Button
                              style={{ marginBottom: "10px" }}
                              onClick={() => {
                                configForm.setFieldValue("nonce", nanoid());
                              }}
                            >
                              Gen nonce
                            </Button>
                          </>
                        )}
                        <Form.Item<FieldType>
                          label="State"
                          name="state"
                          rules={[
                            {
                              required: false,
                              message: "Please input your state",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                        <h4>{`POST: ${url}/oauth2/v1/authorize?`}</h4>
                        <p>client_id={clientId ? clientId : "undefined"}&</p>
                        <p>
                          code_challenge=
                          {challenge ? challenge : "undefined"}&
                        </p>
                        <p>code_challenge_method=s256&</p>
                        <p>
                          redirect_uri=
                          {redirectUrl ? redirectUrl : "undefined"}&
                        </p>
                        <p>scope={scope ? scope.join(",") : "undefined"}&</p>
                        <p>
                          response_type=
                          {responseType ? responseType : "undefined"}&
                        </p>
                        <p>{state && `state=${state}`}</p>
                        <p>
                          {`Headers: {
                      Content-Type: application/x-www-form-urlencoded
                      }`}
                        </p>
                        <Form.Item wrapperCol={{ offset: 0, span: 16 }}>
                          <Button type="primary" htmlType="Submit">
                            Get auth code
                          </Button>
                        </Form.Item>
                      </Form>
                    </Panel>
                  </Collapse>
                </div>
              ),
            },
            {
              status: steps[2],
              description: (
                <>
                  <Collapse
                    style={{ width: "100%" }}
                    activeKey={steps[2] === "process" ? "2" : "0"}
                  >
                    <Panel header="Request tokens" key="2">
                      <Card>
                        <h4>Call back parameters</h4>
                        <p>Grant code: {code}</p>
                        <p>State: {stateParam}</p>
                      </Card>
                      <Card>
                        <h4>{`POST: ${sessionStorage.getItem(
                          "url"
                        )}/oauth2/v1/token`}</h4>
                        <p>
                          {`Headers: {
                      Content-Type: application/x-www-form-urlencoded
                      }`}
                        </p>
                        <p>client_id: {sessionStorage.getItem("clientId")}</p>
                        <p>
                          redirect_uri: {sessionStorage.getItem("redirect_uri")}
                        </p>
                        <p>code: {code}</p>
                        <p>
                          code_verifier: {sessionStorage.getItem("verifier")}
                        </p>
                        {requiresSecret && (
                          <FormItem
                            label="Client secret"
                            style={{ maxWidth: 600 }}
                          >
                            <Input
                              value={clientSecret ? clientSecret : undefined}
                              onChange={(e) => setClientSecret(e.target.value)}
                            />
                          </FormItem>
                        )}
                        <Space.Compact style={{ width: "100%" }}>
                          {requiresSecret ? (
                            <Button onClick={fetchTokensServer}>
                              Get tokens
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              onClick={fetchTokensBrowser}
                              disabled={requiresSecret && !clientSecret}
                            >
                              Get tokens
                            </Button>
                          )}
                        </Space.Compact>
                        <Button onClick={clear} style={{ marginTop: "20px" }}>
                          Clear
                        </Button>
                      </Card>
                    </Panel>
                  </Collapse>
                </>
              ),
            },
            {
              status: steps[3],
              description: (
                <>
                  <Collapse
                    style={{ width: "100%" }}
                    activeKey={steps[3] === "process" ? "3" : "0"}
                  >
                    <Panel header="Get user" key="3">
                      {tokenResponse && (
                        <>
                          <p>
                            <b>Response 🥳</b>
                            <p>POST: /oauth2/v1/token</p>
                          </p>
                          <CopyBlock
                            text={
                              tokenResponse &&
                              JSON.stringify(tokenResponse, null, 4)
                            }
                            language={"json"}
                            showLineNumbers={true}
                            startingLineNumber={1}
                            theme={dracula}
                            codeBlock
                          />
                        </>
                      )}
                      {idToken && displayDecodedTokens && (
                        <>
                          <p>
                            <b>Decoded Id token 🎉</b>
                          </p>
                          <CopyBlock
                            text={
                              idToken &&
                              JSON.stringify(jwtDecode(idToken), null, 4)
                            }
                            language={"json"}
                            showLineNumbers={true}
                            startingLineNumber={1}
                            theme={dracula}
                            codeBlock
                          />
                          <br />
                          <Tag>Hint: 'sub' is the users unique identifier</Tag>
                        </>
                      )}
                      {accessToken && displayDecodedTokens && (
                        <div>
                          <p>
                            <b>Decoded access token 🎉</b>
                          </p>
                          <CopyBlock
                            text={
                              accessToken &&
                              JSON.stringify(jwtDecode(accessToken), null, 4)
                            }
                            language={"json"}
                            showLineNumbers={true}
                            startingLineNumber={1}
                            theme={dracula}
                            codeBlock
                          />
                          <br />
                          <Tag>Hint: 'uid' is the same as the 'sub' value</Tag>
                        </div>
                      )}
                      {!displayDecodedTokens ? (
                        <Button
                          onClick={() => setDisplayDecodedTokens(true)}
                          style={{ marginTop: "20px" }}
                        >
                          Decode tokens
                        </Button>
                      ) : (
                        <Button onClick={clear} style={{ marginTop: "20px" }}>
                          Clear
                        </Button>
                      )}
                    </Panel>
                  </Collapse>
                </>
              ),
            },
          ]}
        />
      </>
    );
  };

  useEffect(() => {
    // Get the fragment identifier
    const hash = window.location.hash;

    if (hash) {
      // Remove the leading '#'
      const queryString = hash.substring(1);

      // Parse the parameters
      const urlParams = new URLSearchParams(queryString);

      // Extract the parameters into an object
      const paramsObj = {
        accessToken: urlParams.get("access_token"),
        tokenType: urlParams.get("token_type"),
        expiresIn: urlParams.get("expires_in"),
        scope: urlParams.get("scope"),
        state: urlParams.get("state"),
      };
      showModal();
      setAccessToken(paramsObj.accessToken);
    }

    if (code) {
      const updatedSteps = steps;
      updatedSteps[1] = "finish";
      updatedSteps[2] = "process";
      setSteps(updatedSteps);
    } else {
      configForm.setFieldsValue({
        url: "https://dev-09146087.okta.com",
        clientId: "0oaethwmhtYeayAr25d7",
        redirectUrl: "http://localhost:5173/",
        scope: ["openid", "profile"],
        responseType: "code",
        auth_type: AuthType.CODE_PKCE,
      });
    }
  }, [code, configForm, implicitAccessToken, steps]);

  console.log(token, "RENDER");
  return (
    <>
      {/* <img src={oktaLogo} style={{ maxWidth: "200px" }} /> */}
      <h1>Authentication with Okta</h1>
      <Modal
        title="Access token"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        cancelButtonProps={{ hidden: true }}
      >
        <Paragraph
          copyable={{
            tooltips: ["click here", "Copied!!"],
          }}
        >
          {accessToken}
        </Paragraph>
      </Modal>
      {/* <Tabs defaultActiveKey="CODE_PKCE" items={items} onChange={onTabChange} /> */}
      {renderCodeGrantPKCE()}
      {token && (
        <>
          <h3>Access token</h3>
          <Input value={token.access_token} />
        </>
      )}
      <p> OAuth 2.0 authorization protocol</p>

      <p>client Id: 0oaf048c1vLjHIUhb5d7 </p>
      <p>
        client secret:
        P7SowbYimUG-P4eHlyXgCBgHNTO7nxVrpI5O-zZ6Sz5DIFKoquHTGzy8wXkowDqs{" "}
      </p>
    </>
  );
}

export default App;
