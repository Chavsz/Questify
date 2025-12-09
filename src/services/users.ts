import { db, auth } from "../firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";

// User interface for type safety
export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  emoji: string;
  slot?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  isActive: boolean;
  role: string;
  preferences: {
    theme: string;
    notifications: boolean;
  };
  streak?: number; // Login streak in days
  lastQuestDate?: string; // YYYY-MM-DD format
  questStats?: Record<string, number>;
  inventory?: InventoryItem[];
  exp?: number; // Experience points
  level?: number; // User level
  coins?: number; // User coins
  selectedCharacter?: string; // Selected avatar character id
  unlockedCharacters?: string[]; // Array of unlocked character ids
}

// Add item to user inventory
export const addItemToInventory = async (uid: string, item: InventoryItem) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  let inventory: InventoryItem[] = [];
  if (userSnap.exists()) {
    const data = userSnap.data();
    inventory = data.inventory || [];
  }
  const existing = inventory.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
    if (!existing.slot && item.slot) {
      existing.slot = item.slot;
    }
  } else {
    inventory.push(item);
  }
  await updateDoc(userRef, { inventory, updatedAt: serverTimestamp() });
};

// Remove item from user inventory
export const removeItemFromInventory = async (uid: string, itemId: number, qty: number = 1) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  let inventory: InventoryItem[] = [];
  if (userSnap.exists()) {
    const data = userSnap.data();
    inventory = data.inventory || [];
  }
  const idx = inventory.findIndex(i => i.id === itemId);
  if (idx !== -1) {
    inventory[idx].quantity -= qty;
    if (inventory[idx].quantity <= 0) inventory.splice(idx, 1);
    await updateDoc(userRef, { inventory, updatedAt: serverTimestamp() });
  }
};

// Create or update user in Firestore
export const createUser = async (userData: Omit<User, 'createdAt' | 'updatedAt'>) => {
  try {
    const userRef = doc(db, 'users', userData.uid);
    const userDoc = {
      ...userData,
      coins: userData.coins ?? 1250,
      exp: userData.exp ?? 0,
      level: userData.level ?? 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    // Remove any undefined values to prevent Firestore errors
    const cleanUserDoc = Object.fromEntries(
      Object.entries(userDoc).filter(([_, value]) => value !== undefined)
    );
    await setDoc(userRef, cleanUserDoc);
    console.log('User created successfully:', userData.uid);
    return userData.uid;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by UID
export const getUser = async (uid: string): Promise<User | null> => {
  try {
    // Don't log error if UID is empty or undefined
    if (!uid || uid.trim() === '') {
      return null;
    }
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data() as User;
      // Patch for legacy users: if coins is undefined, set to 1250
      if (typeof data.coins !== 'number') {
        data.coins = 1250;
      }
      return data;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user data
export const updateUser = async (uid: string, updateData: Partial<User>) => {
  try {
    if (!uid || uid.trim() === '') {
      throw new Error('Invalid UID provided to updateUser');
    }
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    const updateDocData = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };
    
    // If user document doesn't exist, create it with default values
    if (!userSnap.exists()) {
      // Try to get user from Firebase Auth to populate initial data
      const currentUser = auth.currentUser;
      
      const newUserData: Omit<User, 'createdAt' | 'updatedAt'> = {
        uid: uid,
        email: currentUser?.email || '',
        displayName: currentUser?.displayName || null,
        photoURL: currentUser?.photoURL || null,
        isActive: true,
        role: 'user',
        preferences: {
          theme: 'light',
          notifications: true,
        },
        coins: updateData.coins ?? 1250,
        exp: updateData.exp ?? 0,
        level: updateData.level ?? 1,
        ...updateData, // Override with provided updateData
      };
      
      // Remove undefined values
      const cleanUserDoc = Object.fromEntries(
        Object.entries(newUserData).filter(([_, value]) => value !== undefined)
      );
      
      await setDoc(userRef, {
        ...cleanUserDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // User exists, just update
      await updateDoc(userRef, updateDocData);
    }
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    console.log('User deleted successfully:', uid);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    const users: User[] = [];
    usersSnap.forEach((doc) => {
      users.push(doc.data() as User);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data() as User;
    } else {
      console.log('No user found with email:', email);
      return null;
    }
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};
