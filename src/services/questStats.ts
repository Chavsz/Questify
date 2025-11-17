import { db } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

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

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekdayKey = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" });

export const recordQuestCompletion = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  const today = new Date();
  const todayKey = getDateKey(today);

  const lastQuestDate: string | undefined = userData.lastQuestDate;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  let streak = userData.streak || 0;
  if (!lastQuestDate) {
    streak = 1;
  } else if (lastQuestDate === todayKey) {
    // already counted today, keep streak
  } else if (lastQuestDate === yesterdayKey) {
    streak += 1;
  } else {
    streak = 1;
  }

  const currentStats: QuestStats = userData.questStats || {};
  const weekdayKey = getWeekdayKey(today);
  const updatedStats = {
    ...currentStats,
    [weekdayKey]: (currentStats[weekdayKey] || 0) + 1,
  };

  await updateDoc(userRef, {
    streak,
    lastQuestDate: todayKey,
    questStats: updatedStats,
    updatedAt: serverTimestamp(),
  });
};
