import { AuthType } from "./constants";

export const authorise = async (
  _authType,
  _client_id,
  _redirect_uri,
  _scope,
  _url,
  _code_challenge,
  _code_verifier,
  _nonce,
  _state
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
      : "response_type=code";

  let url = `${_url}/oauth2/v1/authorize?${client_id}&${redirect_uri}&${scope}&${response_type}`;

  if (_nonce) {
    url = `${url}&nonce=${_nonce}`;
  }

  if (_code_challenge && _code_verifier) {
    url = `${url}&${code_challenge}&${code_challenge_method}`;
  }

  url = `${url}&${state}`;
  window.location.href = url;
};
