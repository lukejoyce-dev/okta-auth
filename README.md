# Auth with Okta

## Overview

This tool is designed to test and enhance understanding of four distinct authentication flows using OAuth 2.0 and OpenID Connect within Okta. The authentication flows include:

1. **Code Grant with PKCE (browser)**
2. **Code Grant with Client Secret (server)**
3. **Code Grant with Client Secret and PKCE (server)**
4. **Implicit (Legacy)**

How you have configured your app within Okta will dictate which flow you will use (e.g., client-side or server-side authentication).

This repository consists of a React frontend and a very simple Node.js server with a single API route for obtaining your tokens when selecting a server-side authentication flow. You do not need to run the server if testing the "Code Grant with PKCE" flow. The implicit flow is not recommended but is included for educational purposes.

## Getting Started

### Starting the Client

Navigate to the `client` directory and start the development server:

```sh
cd ./client
npm run dev
```

Your app will be running on :

```sh
http://localhost:5173/

```

### Starting the API Server

Navigate to the `server` directory and start the development server:

```sh
cd ./server
npm run dev
```

## Authentication Flows

### 1. Code Grant with PKCE (Browser)

This flow is intended for client-side authentication and does not require the server. It enhances security by using a Proof Key for Code Exchange (PKCE).

### 2. Code Grant with Client Secret (Server)

This flow is suitable for server-side authentication where a client secret is used to authenticate with Okta.

### 3. Code Grant with Client Secret and PKCE (Server)

This flow combines the security features of both the client secret and PKCE, providing a robust server-side authentication mechanism.

### 4. Implicit (Legacy)

The implicit flow is included for educational purposes and is not recommended for production use due to its security vulnerabilities. It is a client-side flow that does not require a client secret.

## Okta Configuration

Ensure your Okta application is configured correctly for the desired authentication flow. This involves setting up the appropriate client ID, client secret, and redirect URIs in your Okta developer console.

## Contributing

If you have any suggestions or improvements, feel free to create an issue or submit a pull request.

## License

This project is licensed under the MIT License.

---

Happy coding! If you encounter any issues or have questions, please open an issue on this repository.
