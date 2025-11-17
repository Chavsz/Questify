import { db } from "../firebase";
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
}

// Create or update user in Firestore
export const createUser = async (userData: Omit<User, 'createdAt' | 'updatedAt'>) => {
  try {
    const userRef = doc(db, 'users', userData.uid);
    const userDoc = {
      ...userData,
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
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    } else {
      console.log('No user found with UID:', uid);
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
    const userRef = doc(db, 'users', uid);
    const updateDocData = {
      ...updateData,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userRef, updateDocData);
    console.log('User updated successfully:', uid);
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
