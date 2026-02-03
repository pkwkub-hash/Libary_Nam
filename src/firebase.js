import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCZPqL8KMFedskSDJfIiNeJhOezN_M4pAk",
  authDomain: "nicnon-library-7efdd.firebaseapp.com",
  projectId: "nicnon-library-7efdd",
  storageBucket: "nicnon-library-7efdd.firebasestorage.app",
  messagingSenderId: "591039027962",
  appId: "1:591039027962:web:c47498c0f2d8af34f48743",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
