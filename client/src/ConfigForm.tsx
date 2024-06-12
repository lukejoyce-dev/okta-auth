import React from "react";
import { Form, Select, Input, Button } from "antd";
import { AuthType } from "./constants";

const ConfigForm = ({ onFinish, handleAuthTypeChange, generatePkce }) => {
  const { Option } = Select;
  const [configForm] = Form.useForm();
  const authType = Form.useWatch("auth_type", configForm);

  return (
    <Form form={configForm} layout="vertical" onFinish={onFinish}>
      <Form.Item label="Auth type" name="auth_type">
        <Select
          onChange={handleAuthTypeChange}
          defaultValue={AuthType.CODE_PKCE}
        >
          <Option value={AuthType.CODE_PKCE}>
            xCode grant + PKCE (browser)
          </Option>
          <Option value={AuthType.CODE_SECRET}>
            Code grant + client secret (server)
          </Option>
          <Option value={AuthType.CODE_SECRET_PKCE}>
            Code grant + client secret + PKCE (server)
          </Option>
          <Option value={AuthType.IMPLICIT}>Implicit (legacy)</Option>
        </Select>
      </Form.Item>
      {!hidePKCE && (
        <>
          <Form.Item label="Code Verifier" name="verifier">
            <Input />
          </Form.Item>
          <Form.Item label="Code Challenge" name="challenge">
            <Input />
          </Form.Item>
          <Button onClick={generatePkce}>Generate PKCE</Button>
        </>
      )}
      <Form.Item
        label="URL"
        name="url"
        rules={[{ required: true, type: "url" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Client Id" name="clientId" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item
        label="Redirect URL"
        name="redirectUrl"
        rules={[{ required: true, type: "url" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="Scope" name="scope" rules={[{ required: true }]}>
        <Select mode="multiple">
          <Option value="openid">OpenId</Option>
          <Option value="profile">Profile</Option>
          <Option value="email">Email</Option>
          {/* Add other options here */}
        </Select>
      </Form.Item>
      <Form.Item
        label="Response Type"
        name="responseType"
        rules={[{ required: true }]}
      >
        <Select disabled>
          <Option value="code">Code</Option>
          <Option value="token">Token</Option>
        </Select>
      </Form.Item>
      {authType === AuthType.IMPLICIT && (
        <>
          <Form.Item label="Nonce" name="nonce" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button
            onClick={() => configForm.setFieldsValue({ nonce: nanoid() })}
          >
            Generate Nonce
          </Button>
        </>
      )}
      <Form.Item label="State" name="state">
        <Input />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        Get auth code
      </Button>
    </Form>
  );
};

export default ConfigForm;
