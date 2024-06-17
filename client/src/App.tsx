import "./App.css";
import {
  Col,
  FloatButton,
  Form,
  Modal,
  Row,
  Steps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { GithubOutlined } from "@ant-design/icons";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Steps as AuthSteps } from "./types/authTypes";
import AuthForm from "./components/AuthForm";
import TokenFetcher from "./components/TokenFetcher";
import TokenDisplay from "./components/TokenDisplay";

const { Paragraph } = Typography;
const defaultSteps = {
  1: AuthSteps.PROCESS,
  2: AuthSteps.WAIT,
  3: AuthSteps.WAIT,
};
const pkceInfo =
  "PKCE is short for Proof Key for Code Exchange. It is a mechanism that came into being to make the use of OAuth 2.0 Authorization Code grant more secure";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tokenResponse, setTokenResponse] = useState<any>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [verifier] = useState<string | null>(null);
  const [steps, setSteps] = useState<{
    1: AuthSteps;
    2: AuthSteps;
    3: AuthSteps;
  }>(defaultSteps);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayDecodedTokens, setDisplayDecodedTokens] =
    useState<boolean>(false);
  const code = searchParams.get("code");
  const implicitAccessToken = searchParams.get("access_token");
  const [configForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    if (verifier) {
      window.localStorage.setItem("code_verifier", verifier);
    }
  }, [verifier]);

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const queryString = hash.substring(1);
      const urlParams = new URLSearchParams(queryString);

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
      setSteps((prevSteps) => ({ ...prevSteps, 1: "finish", 2: "process" }));
    }
  }, [code, implicitAccessToken]);

  const clearUrlParams = () => {
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

  const clear = () => {
    setSteps(defaultSteps);
    configForm.resetFields();
    sessionStorage.clear();
    searchParams.delete("code");
    searchParams.delete("state");
    setSearchParams(searchParams);
  };

  const renderPage = () => (
    <>
      <p>
        This tool is designed to test and enhance your understanding of four
        distinct authentication flows using OAuth 2.0 and OpenID Connect within
        Okta. Authentication flows include:
      </p>
      <Row>
        <Col xs={24} sm={12} md={12} lg={8} xl={12}>
          <p>
            #1 Code Grant with{" "}
            <Tooltip title={pkceInfo}>
              <u>PKCE</u>
            </Tooltip>
          </p>
        </Col>
        <Col xs={24} sm={12} md={12} lg={8} xl={12}>
          <p>#2 Code Grant with Client Secret</p>
        </Col>
        <Col xs={24} sm={12} md={12} lg={8} xl={12}>
          <p>
            #3 Code Grant with Client Secret and{" "}
            <Tooltip title={pkceInfo}>
              <u>PKCE</u>
            </Tooltip>
          </p>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <p>#4 Implicit (Legacy)</p>
        </Col>
      </Row>

      <Steps
        direction="vertical"
        current={Object.values(steps).indexOf("process") + 1}
        items={[
          {
            title: "Step 1",
            status: steps[1],
            description: <AuthForm steps={steps} setSteps={setSteps} />,
          },
          {
            title: "Step 2",
            status: steps[2],
            description: (
              <TokenFetcher
                steps={steps}
                setAccessToken={setAccessToken}
                setIdToken={setIdToken}
                setSteps={setSteps}
                setTokenResponse={setTokenResponse}
                clear={clear}
              />
            ),
          },
          {
            title: "Step 3",
            status: steps[3],
            description: (
              <TokenDisplay
                setDisplayDecodedTokens={setDisplayDecodedTokens}
                displayDecodedTokens={displayDecodedTokens}
                steps={steps}
                accessToken={accessToken}
                idToken={idToken}
                tokenResponse={tokenResponse}
                clear={clear}
              />
            ),
          },
        ]}
      />
    </>
  );

  return (
    <>
      <h1>
        Auth with Okta <Tag> OAuth 2.0</Tag>
        <Tag>OpenID</Tag>
      </h1>
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
      {renderPage()}
      <p>
        Built by{" "}
        <a
          href="http://lukejoyce.co.uk"
          target="_blank"
          rel="noopener noreferrer"
        >
          Luke Joyce
        </a>
      </p>
      <FloatButton
        icon={<GithubOutlined />}
        href="https://github.com/lukejoyce-dev/okta-auth"
        target="_blank"
      />
    </>
  );
}

export default App;
