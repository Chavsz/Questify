import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export interface QuestStats {
  [day: string]: number; // e.g., { Mon: 2, Tue: 1, ... }
}

export const getUserQuestStats = async (uid: string): Promise<QuestStats> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    // Assume questStats is stored as { Mon: 2, Tue: 1, ... }
    return data.questStats || {};
  }
  return {};
};
