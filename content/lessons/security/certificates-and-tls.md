---
id: certificates-and-tls
title: Certificates and transport security
summary: How PI System traffic is encrypted - Windows transport security since PI Server 2015, TLS in PI Server 2023, HTTPS-only PI Web API, and the commands that register and check certificates.
domain: security
coverage: [sec.certificates]
level: expert
roles: [pi-admin]
minutes: 20
order: 40
objectives:
  - Explain how Data Archive traffic was encrypted before and after PI Server 2023
  - Register and verify Data Archive and AF Server TLS certificates
  - Choose a certificate that every client will trust
  - Configure PI Web API authentication and HTTPS safely
keyTerms: [tls, transport-security, certificate-thumbprint, self-signed-certificate, pidiag, basic-authentication, anonymous-authentication, openid-connect, aveva-identity-manager, x-requested-with, pi-web-api-admin-utility]
knowledgeCheck: [q-certificates-tls-optional, q-certificates-pidiag-register, q-certificates-webapi-http]
related: [hardening-and-kerberos, troubleshooting-logs-errors]
sources: [ops2-uc15-roadmap-hughes, ops2-uc23-claims-auth-biggins, ops2-uc23-security-biggins, ops2-uc23-pi-server-geneva, ops2-pisquare-vision-collective, ops2-cisa-cm0143-webapi, ops2-uc17-secure-webapi, adm-uc23-security-biggins, adm-pisquare-pivision-collective-tls, adm-visualizing-workbook-2024, adm-mulesoft-pi-setup]
verify: true
verifyNote: No readable source states which TLS protocol version the Data Archive uses or requires; that PI Server 2015 transport security is Windows SSPI encryption rather than TLS is inferred from a slide. PI Web API certificate replacement steps beyond the Admin Utility were not found.
---

## Plain English

Encryption in transit stops someone on the network from reading or changing PI data and passwords.
The PI System has added it in stages:

- **PI Server 2015** brought **transport security** for the Data Archive using the Windows
  protocol in use: NTLM with RC4/MD5, or Kerberos (Active Directory) with AES256/SHA1.
- **PI Server 2023** added **TLS** with certificates. It "Natively encrypts communication for all AVEVA
  PI System authentication methods (OIDC, Windows, PI Trust)". It is optional for PI Server, but
  required if you use OIDC authentication and AVEVA Identity Manager.
- **PI Web API** has always been HTTPS: "PI Web API has no HTTP option".

A certificate only helps if clients **trust** it. That is where most problems come from.

## Deep Dive

**Data Archive certificate commands** (UC23 claims-authentication deck):

| Task | Command |
|---|---|
| Choose certificate | At install |
| Register or change | `pidiag -tls -r <thumbprint>` (`--register`) |
| Verify | `pidiag -tls -y` (`--verify`) |

**AF Server certificate.** Change it with `AFDiag /CT:<thumbprint>` (`/CertificateThumbprint:`). It is
stored as the registry value `CERTIFICATETHUMBPRINT` under
`HKLM\SYSTEM\CurrentControlSet\Services\AFService`.

**Trust.** Components on one server can share a certificate, which needs to be trusted by all clients.
Self-signed certificates are trusted only locally or where you import them. If OIDC is turned on and
clients do not trust the certificate, there is "No popup if the certificate isn't present", so it just
fails. AF SDK clients have a `preferOIDCAuth` setting in AFSDK.config (Prompt, Never, Always).
Automatic certificate rotation was listed "In development" in 2023.

**PI Web API.**

- Listens on port 443 for HTTPS by default. The installer asks for the certificate and the Admin
  Utility is the only supported place to change it (along with listen port and authentication).
- Certificate choices include self-signed, Windows domain CA, Let's Encrypt or commercial.
- Authentication: OpenID Connect/Bearer, Kerberos, Basic, Anonymous. "Bearer and Kerberos are mutually
  exclusive"; "Anonymous authentication disables all other types", and AVEVA recommends against it.
  Basic exposes credentials on the network.
- CSRF defence: POST, PATCH and DELETE clients must send `X-Requested-With: XMLHttpRequest`.

**PI Vision** is reached at `https://webServer/PIVision` by default.

## Worked Example

A PI Vision server logs "client attempted TLS connection but PInetmgr does not have a certificate
loaded" (message ID 748) when connecting to a collective.

1. On each Data Archive member, run `pidiag -tls -y` to see whether a certificate is registered.
2. On the member without one, find the thumbprint of a suitable certificate in the machine store and
   run `pidiag -tls -r <thumbprint>`.
3. Make sure every client (PI Vision server included) trusts the issuing CA. A self-signed certificate
   would need importing on every client.
4. In the PI Square case, a community member suggested installing each server's certificate on the
   other server without copying private keys; this fix was not confirmed.
5. For AF, repeat with `AFDiag /CT:<thumbprint>` if the AF Server certificate must change.

## Diagram

```mermaid
sequenceDiagram
  participant C as PI client
  participant D as Data Archive
  participant S as Windows certificate store
  D->>S: Load certificate registered by pidiag -tls -r
  C->>D: Start TLS connection
  D-->>C: Present certificate
  C->>C: Check issuer is trusted
  C->>D: Authenticate with OIDC, Windows or trust over TLS
  D-->>C: Encrypted session
```

## Common Mistakes

- **Self-signed certificates on a multi-server system** without importing them to every client.
- **Turning on OIDC before certificates are trusted.** Clients fail with no prompt.
- **Enabling Anonymous on PI Web API**, which disables all other authentication.
- **Using Basic authentication over untrusted networks.**
- **Disabling CSRF defence** to make a third-party tool work (some guides set `EnableCSRFDefense` to
  false).
- **Forgetting certificate expiry.** Rotation was not automatic as of 2023.

## Real-World Scenario

AVEVA's AVEVA World 2023 security session described TLS as an "Optional feature; required for OIDC
Authentication and AIM". A site planning to move PI Vision and PI Web API users to AVEVA Identity Manager
therefore has to deploy trusted certificates to the Data Archive (with `pidiag -tls`), the AF Server
(with `AFDiag /CT`) and PI Web API first, and push the issuing CA to every client. Doing the
certificate work first, and checking it with `pidiag -tls -y`, avoids the silent OIDC failures the deck
warns about.
