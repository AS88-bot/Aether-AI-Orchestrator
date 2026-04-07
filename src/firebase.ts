import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhXQJj4Z0kg9B3zHTpWEBFovmKZWYdFyg",
  authDomain: "aether-ai-178b1.firebaseapp.com",
  projectId: "aether-ai-178b1",
  storageBucket: "aether-ai-178b1.firebasestorage.app",
  messagingSenderId: "938459324976",
  appId: "1:938459324976:web:5a5ec2ceff1c790f6083f5",
  measurementId: "G-S2N629JYJ4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
