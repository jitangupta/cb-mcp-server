import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set. " +
      "Point it at your Firebase service account JSON key file.",
  );
}

const app = initializeApp({ credential: cert(credPath) });

export const db = getFirestore(app);
