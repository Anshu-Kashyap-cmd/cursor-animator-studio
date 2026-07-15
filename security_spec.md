# Security Specification: Cursor Animator Studio

## Data Invariants
1. **Owner Integrity**: A project or export history document cannot be created or updated with a `user_id` that differs from the authenticated user's UID (`request.auth.uid`).
2. **Access Isolation**: Standard users can only read, write, query (list), or delete documents that they own. Blanket query reads are strictly forbidden.
3. **Volumetric Protection**: Fields (such as strings and arrays) are constrained by maximum sizing limits to prevent Denial of Wallet memory/CPU exhaust attacks.
4. **Id Hardening**: Document IDs are validated to ensure they are alphanumeric and safely sized to prevent ID poisoning.

---

## The "Dirty Dozen" Attack Payloads

1. **Anonymous Project Modification**: Attempting to write a project document without authentication.
2. **Identity Spoofing (Create)**: Authenticated as `alice_123` but attempting to create a project document with `user_id: "bob_456"`.
3. **Identity Spoofing (Update)**: Authenticated as `alice_123` but attempting to modify a project belonging to `bob_456`.
4. **ID Poisoning Attack**: Attempting to create a project with a 2MB garbage-character string as the document ID.
5. **No Blanket Query / List Attack**: Attempting to list all projects in the collection without filtering by the authenticated user's own `user_id`.
6. **Project Schema Violation (Missing Frames)**: Attempting to save a project without the mandatory `frames` array field.
7. **Export History Identity Spoofing**: Attempting to write an export history log entry with `user_id: "someone_else"`.
8. **Invalid Export Format Injection**: Logging an export history with an unsupported format like `exported_format: "exe"`.
9. **Volumetric String Payload Poisoning**: Attempting to save a project name containing a 10MB text string.
10. **Array Injection Overflow**: Attempting to save a project with an excessively large palette list (e.g. 10,000 items).
11. **Negative Value / Type Poisoning**: Specifying `total_duration_ms` as a negative integer or a boolean value instead of a valid positive number.
12. **Tampering with Immutable ID**: Attempting to change the `id` property of an existing project document during update.

---

## Security Verification Test Suite (`firestore.rules.test.ts`)

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, getDocs, query, where, collection } from "firebase/firestore";
import * as fs from "fs";

let testEnv: RulesTestEnvironment;

describe("Firestore Security Rules Tests", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "disco-venture-17c1c",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it("Attack 1: Denies anonymous project modifications", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(unauthDb, "projects/proj_1"), {
      id: "proj_1",
      user_id: "alice",
      name: "Cursor",
      mode: "manual",
      frame_count: 1,
      total_duration_ms: 100,
      easing: "linear",
      hotspot_x: 0,
      hotspot_y: 0,
      created_at: "2026-07-14",
      updated_at: "2026-07-14",
      frames: []
    }));
  });

  it("Attack 2: Denies identity spoofing during project creation", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(aliceDb, "projects/proj_1"), {
      id: "proj_1",
      user_id: "bob",
      name: "Spoofing Alice",
      mode: "manual",
      frame_count: 1,
      total_duration_ms: 100,
      easing: "linear",
      hotspot_x: 0,
      hotspot_y: 0,
      created_at: "2026-07-14",
      updated_at: "2026-07-14",
      frames: []
    }));
  });

  it("Attack 5: Denies blanket queries without userId filter", async () => {
    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    const q = collection(aliceDb, "projects");
    await assertFails(getDocs(q)); // Missing 'where' filter for security
  });
});
```
