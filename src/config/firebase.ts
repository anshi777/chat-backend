
import "dotenv/config";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const firebaseApp = initializeApp({
  credential: applicationDefault(),
  projectId: "chat-backend-project-b4bb0",
});

export const db = getFirestore(firebaseApp);
