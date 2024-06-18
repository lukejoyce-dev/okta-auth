import React from "react";
import { Button, Collapse, Tag } from "antd";
import { CopyBlock, dracula } from "react-code-blocks";
import { jwtDecode } from "jwt-decode";
import { StepsList, TokenResponse } from "../types/authTypes";

const { Panel } = Collapse;

interface TokenDisplayProps {
  steps: StepsList;
  tokenResponse: TokenResponse;
  idToken: string | null;
  accessToken: string | null;
  displayDecodedTokens: boolean;
  setDisplayDecodedTokens: (value: boolean) => void;
  clear: () => void;
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({
  steps,
  tokenResponse,
  idToken,
  accessToken,
  displayDecodedTokens,
  setDisplayDecodedTokens,
  clear,
}) => {
  const renderDecodedToken = (token: string, title: string, hint: string) => (
    <>
      <p>
        <b>{title} 🎉</b>
      </p>
      <CopyBlock
        text={JSON.stringify(jwtDecode(token), null, 4)}
        language="json"
        showLineNumbers
        startingLineNumber={1}
        theme={dracula}
        codeBlock
      />
      <br />
      <Tag>{hint}</Tag>
    </>
  );

  return (
    <Collapse
      style={{ width: "100%" }}
      activeKey={steps[3] === "process" ? "3" : "0"}
    >
      <Panel header="Get user" key="3">
        {tokenResponse && (
          <>
            <p>
              <b>Response 🥳</b>
            </p>
            <div>POST: /oauth2/v1/token</div>
            <CopyBlock
              text={JSON.stringify(tokenResponse, null, 4)}
              language="json"
              showLineNumbers
              startingLineNumber={1}
              theme={dracula}
              codeBlock
            />
          </>
        )}
        {idToken &&
          displayDecodedTokens &&
          renderDecodedToken(
            idToken,
            "Decoded Id token",
            "Hint: 'sub' is the user's unique identifier"
          )}
        {accessToken &&
          displayDecodedTokens &&
          renderDecodedToken(
            accessToken,
            "Decoded access token",
            "Hint: 'uid' is the same as the 'sub' value"
          )}
        {!displayDecodedTokens ? (
          <Button
            onClick={() => setDisplayDecodedTokens(true)}
            style={{ marginTop: "20px" }}
          >
            Decode tokens
          </Button>
        ) : (
          <div>
            <Button onClick={clear} style={{ marginTop: "20px" }}>
              Clear
            </Button>
          </div>
        )}
      </Panel>
    </Collapse>
  );
};

export default TokenDisplay;
