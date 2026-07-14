import { get, set, keys, del } from "idb-keyval";
import { db } from "./firebase.ts";
import { doc, setDoc, getDoc, collection, getDocs, query, where, deleteDoc, orderBy } from "firebase/firestore";
import { ProjectData, ExportHistoryEntry } from "../types.ts";

const IDB_PREFIX = "cas_project_";
const EXPORT_HISTORY_IDB_KEY = "cas_export_history";

/**
 * Saves a project to Firestore (if signed in) or IndexedDB (if anonymous).
 */
export async function saveProjectToDb(project: ProjectData, userId?: string | null): Promise<void> {
  const updatedProject = {
    ...project,
    user_id: userId || null,
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    // Save to Firebase Firestore
    try {
      const docRef = doc(db, "projects", project.id);
      await setDoc(docRef, updatedProject);
    } catch (error) {
      console.error("Failed to save project to Firestore:", error);
      // Fallback: Save to IndexedDB if firestore fails
      await set(`${IDB_PREFIX}${project.id}`, updatedProject);
    }
  } else {
    // Save to IndexedDB
    await set(`${IDB_PREFIX}${project.id}`, updatedProject);
  }
}

/**
 * Loads all projects for a user. If not signed in, loads all IndexedDB projects.
 */
export async function loadProjectsFromDb(userId?: string | null): Promise<ProjectData[]> {
  if (userId) {
    try {
      const q = query(
        collection(db, "projects"),
        where("user_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      const firestoreProjects: ProjectData[] = [];
      snapshot.forEach((doc) => {
        firestoreProjects.push(doc.data() as ProjectData);
      });
      // Sort by updated_at descending
      return firestoreProjects.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } catch (error) {
      console.error("Failed to load projects from Firestore:", error);
    }
  }

  // Load from IndexedDB
  const allKeys = await keys();
  const projectKeys = allKeys.filter((key) => typeof key === "string" && key.startsWith(IDB_PREFIX));
  const localProjects: ProjectData[] = [];
  
  for (const key of projectKeys) {
    const project = await get<ProjectData>(key);
    if (project) {
      localProjects.push(project);
    }
  }

  return localProjects.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

/**
 * Fetches a single project by ID.
 */
export async function loadProjectById(projectId: string, userId?: string | null): Promise<ProjectData | null> {
  if (userId) {
    try {
      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as ProjectData;
      }
    } catch (error) {
      console.error("Failed to fetch project from Firestore:", error);
    }
  }

  // Check IndexedDB
  const project = await get<ProjectData>(`${IDB_PREFIX}${projectId}`);
  return project || null;
}

/**
 * Deletes a project by ID from Firestore and/or IndexedDB.
 */
export async function deleteProjectFromDb(projectId: string, userId?: string | null): Promise<void> {
  if (userId) {
    try {
      const docRef = doc(db, "projects", projectId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Failed to delete project from Firestore:", error);
    }
  }
  
  await del(`${IDB_PREFIX}${projectId}`);
}

/**
 * Adds an entry to export history (syncs with Firestore or IndexedDB).
 */
export async function saveExportHistory(entry: ExportHistoryEntry, userId?: string | null): Promise<void> {
  const finalEntry = {
    ...entry,
    user_id: userId || null,
  };

  if (userId) {
    try {
      const docRef = doc(db, "export_history", entry.id);
      await setDoc(docRef, finalEntry);
      return;
    } catch (error) {
      console.error("Failed to save export history to Firestore:", error);
    }
  }

  // Fallback / local save
  const history = (await get<ExportHistoryEntry[]>(EXPORT_HISTORY_IDB_KEY)) || [];
  history.unshift(finalEntry);
  await set(EXPORT_HISTORY_IDB_KEY, history.slice(0, 50)); // Keep last 50
}

/**
 * Loads export history for a user (or local).
 */
export async function loadExportHistory(userId?: string | null): Promise<ExportHistoryEntry[]> {
  if (userId) {
    try {
      const q = query(
        collection(db, "export_history"),
        where("user_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      const history: ExportHistoryEntry[] = [];
      snapshot.forEach((doc) => {
        history.push(doc.data() as ExportHistoryEntry);
      });
      return history.sort(
        (a, b) => new Date(b.exported_at).getTime() - new Date(a.exported_at).getTime()
      );
    } catch (error) {
      console.error("Failed to load export history from Firestore:", error);
    }
  }

  return (await get<ExportHistoryEntry[]>(EXPORT_HISTORY_IDB_KEY)) || [];
}
