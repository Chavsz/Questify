// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxnyxJMsO40OjkD9EvGFnIaP7y4LtElQc",
  authDomain: "ite183-project.firebaseapp.com",
  projectId: "ite183-project",
  storageBucket: "ite183-project.firebasestorage.app",
  messagingSenderId: "415917171955",
  appId: "1:415917171955:web:dcddab2e8ea4b4d8648386"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
