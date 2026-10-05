# Security Policy

## 🛡️ Overview & Commitment
**Cursor Animator Studio** is committed to upholding the highest standards of software security, privacy, and integrity. As a client-first, open-source tool, we prioritize user security by design, strictly eliminating remote vulnerabilities and unnecessary data exfiltration.

Project Maintainer & Lead Developer: **Anshu Kashyap**  
Official Website & Portal: [aicreation2026.blogspot.com](https://aicreation2026.blogspot.com)

---

## 🔒 Security Architecture Highlights

1. **100% Client-Side In-Memory Execution**:
   - All image processing, video-to-frame extraction, chroma key calculations, color quantization, and `.ANI` / `.CUR` binary compilation run strictly within your browser's local sandbox memory (`OffscreenCanvas`, `HTML5 Canvas`, and Web Workers).
   - No uploaded images, video files, or cursor assets are ever uploaded to any third-party remote server.

2. **No User Credentials or Plaintext Tokens**:
   - The application functions entirely login-free and unauthenticated.
   - We do not store passwords, session tokens, or API keys in the client or browser storage.

3. **Isolated Local Storage (IndexedDB Sandboxing)**:
   - User projects, timeline configurations, and export histories are persisted strictly inside the user's browser using origin-isolated `IndexedDB`.
   - Data stored in this manner is private to your local browser profile and inaccessible to other domains or external applications.

4. **Binary & File Buffer Sanitization**:
   - Custom RIFF/ACON, BMP, and ICO parsers rigorously validate byte offsets, chunk lengths, and dimensions to prevent buffer overflows, infinite parsing loops, or malformed data attacks when handling external `.ani` or `.cur` files.

---

## 📋 Supported Versions

| Version | Supported | Security Notes |
| :--- | :---: | :--- |
| `1.0.x` (Current) | ✅ Yes | Fully patched, login-free client-side architecture. |
| `< 1.0.0` | ❌ No | Deprecated development builds. Please upgrade to latest. |

---

## 🚨 Reporting a Vulnerability

We deeply appreciate the security research community and users who identify and responsibly disclose potential vulnerabilities.

If you discover a security vulnerability, issue, or malformed buffer handling edge-case, please adhere to responsible disclosure:

1. **Initial Contact**:
   - Send details via GitHub Security Advisory (Private Vulnerability Reporting on the repository), or
   - Contact through the official portal: [aicreation2026.blogspot.com](https://aicreation2026.blogspot.com).
2. **What to Include in Your Report**:
   - Description of the vulnerability and affected component.
   - Detailed step-by-step reproduction instructions or a minimal test payload (e.g., sample corrupt file).
   - Potential impact on the user (e.g., browser tab crash, memory exhaustion).
3. **Response Timeline**:
   - **Acknowledgment**: Within 48 hours.
   - **Assessment & Triage**: Within 3 to 5 business days.
   - **Remediation & Patch Release**: High-severity issues are addressed promptly via hotfix commit.

Please do not open public GitHub issues for critical zero-day vulnerabilities prior to our review and remediation.

---

## 🛡️ Best Practices for Users
- Always keep your web browser (Chrome, Edge, Firefox, Brave) updated to the latest stable release for modern WebAssembly and Canvas security features.
- Download or clone **Cursor Animator Studio** only from the official GitHub repository and verified website: [aicreation2026.blogspot.com](https://aicreation2026.blogspot.com).
