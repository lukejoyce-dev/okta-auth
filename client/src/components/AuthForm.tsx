import React, { useEffect } from "react";
import { Form, Input, Button, Select, Collapse, Alert } from "antd";
import { AuthType, FieldType, Steps, StepsList } from "../types/authTypes";
import pkceChallenge from "pkce-challenge";
import { nanoid } from "nanoid";

const { Panel } = Collapse;
const { Option } = Select;
const FormItem = Form.Item;

interface AuthFormProps {
  steps: StepsList;
  setSteps: (steps: StepsList) => void;
}

const authorise = async (
  _authType: AuthType,
  _client_id: string,
  _redirect_uri: string,
  _scope: string[],
  _url: string,
  _code_challenge?: string,
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

const AuthForm: React.FC<AuthFormProps> = ({ steps, setSteps }) => {
  const [configForm] = Form.useForm();
  const authType = Form.useWatch("auth_type", configForm);
  const challenge = Form.useWatch("challenge", configForm);
  const clientId = Form.useWatch("clientId", configForm);
  const redirectUrl = Form.useWatch("redirectUrl", configForm);
  const scope = Form.useWatch("scope", configForm);
  const responseType = Form.useWatch("responseType", configForm);
  const url = Form.useWatch("url", configForm);
  const state = Form.useWatch("state", configForm);

  const onFinish = (values: FieldType) => {
    const {
      verifier,
      challenge,
      url,
      clientId,
      redirectUrl,
      scope,
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
    const updatedSteps = steps;
    updatedSteps[1] = Steps.FINISH;
    updatedSteps[2] = Steps.PROCESS;
    setSteps(updatedSteps);
  };

  const generatePkce = async () => {
    const pkce = await pkceChallenge();
    configForm.setFieldsValue({
      verifier: pkce.code_verifier,
      challenge: pkce.code_challenge,
    });
  };

  const handleAuthTypeChange = (value: AuthType) => {
    sessionStorage.setItem("auth_type", value);
  };

  const hidePKCE =
    authType === AuthType.CODE_SECRET || authType === AuthType.IMPLICIT
      ? true
      : false;

  useEffect(() => {
    // Set auth form default values
    configForm.setFieldsValue({
      url: "https://dev-09146087.okta.com",
      clientId: "0oaethwmhtYeayAr25d7",
      redirectUrl: "http://localhost:5173/",
      scope: ["openid", "profile"],
      responseType: "code",
      auth_type: AuthType.CODE_PKCE,
    });
  }, [configForm]);

  const scopeValidationRule = {
    required: true,
    message: "Please select 'openid' scope",
    validator: async (_, value) => {
      if (!value.includes("openid")) {
        return Promise.reject(
          new Error("Selecting 'openid' scope is required")
        );
      }
    },
  };

  return (
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
          onFinish={onFinish}
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
                  label: "Code grant + client secret + PKCE (server)",
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
            <Button style={{ marginBottom: "10px" }} onClick={generatePkce}>
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
              scopeValidationRule,
            ]}
          >
            <Select mode="multiple" placeholder="Please select your scope">
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
          <Alert
            message="Warning"
            description="While you’re welcome to use this tool, it would be wise to download and run the app locally if you are passing sensitive data. Click the Git icon to view the repository."
            type="warning"
            showIcon
            closable
          />
        </Form>
      </Panel>
    </Collapse>
  );
};

export default AuthForm;
