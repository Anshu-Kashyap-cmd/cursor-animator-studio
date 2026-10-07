# Privacy Policy

**Effective Date:** October 2026  
**Last Updated:** October 2026  
**Project:** Cursor Animator Studio  
**Live Web Application:** [https://cursor-animator-studio.ai.studio](https://cursor-animator-studio.ai.studio)  
**Author / Creator:** Anshu Kashyap  
**Official Portal:** [aicreation2026.blogspot.com](https://aicreation2026.blogspot.com)  

---

## 🔒 Summary: Privacy by Design

Cursor Animator Studio is an open-source, client-side web application and Windows cursor creation workstation. We strictly believe in complete digital privacy. **We do not sell, rent, or monetize your personal data.**

---

## 1. Information Handled & Authentication

- **Google Account Authentication (Required)**: 
  To provide persistent project storage, cloud synchronization across devices, and secure workspace access, users sign in with their Google account via Firebase Authentication.
  - Information received from Google: Your Google User ID (`uid`), display name, and email address.
  - How it is used: Strictly to associate your animated cursor projects and presets with your account in Google Firestore.
  - We do NOT have access to your Google password or any private Google files.
- **Zero Media Cloud Uploads**: 
  Any media you drop into the studio (such as MP4/WebM videos, PNG/JPEG frames, or `.cur`/`.ani` cursors) is processed **100% inside your local device's memory**. Video frames and animations are converted locally in RAM.
- **No Third-Party Spyware or Ad Trackers**: 
  We do not sell data to advertisers, use third-party ad networks, or perform behavioral fingerprinting.

---

## 2. Information Handled Locally on Your Device
- **Browser Local Storage & IndexedDB**:
  - Cursor Animator Studio saves your unfinished projects, frame sequences, canvas layers, and export history directly onto your browser's private `IndexedDB` database.
  - This information remains on your local machine and can be cleared at any time by clearing your browser cache or clicking "Clear Local Cache" in the Settings panel.
- **In-Memory Canvas Processing**:
  - Frame splitting, background removal, chroma keying, and RIFF/ACON binary generation are executed in RAM by your local CPU/GPU using modern Web APIs.

---

## 3. Third-Party Services & External Links
- The application contains direct hyperlinks to the creator's official website: [aicreation2026.blogspot.com](https://aicreation2026.blogspot.com) and associated open-source repositories.
- When visiting external websites via links, their respective privacy policies apply. We encourage you to review their terms.

---

## 4. Open-Source Verification
Because Cursor Animator Studio is open-source under the MIT License, anyone can audit the source code to verify our zero-tracking, zero-data-collection guarantees.

---

## 5. Children's Privacy (COPPA Compliance)
Our service does not address anyone under the age of 13 specifically, nor do we collect any personal data from children or adults. It is entirely safe for users of all ages to design cursors offline.

---

## 6. Updates to This Policy
We may periodically update this Privacy Policy to reflect technical enhancements or regulatory changes. Any modifications will be documented in this repository with updated revision dates.

---

## 7. Contact Information
If you have questions about this Privacy Policy or privacy practices:
- **Author**: Anshu Kashyap
- **Official Website**: [https://aicreation2026.blogspot.com](https://aicreation2026.blogspot.com)
