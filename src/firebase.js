// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCmrQP2L4wiWAmHwfVAfy0wy73WfS5mxqU",
  authDomain: "mental-wellness-companio-4654a.firebaseapp.com",
  projectId: "mental-wellness-companio-4654a",
  storageBucket: "mental-wellness-companio-4654a.firebasestorage.app",
  messagingSenderId: "243115454133",
  appId: "1:243115454133:web:87f579096e97256c4818fc",
  measurementId: "G-HBT0JHKDS8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
