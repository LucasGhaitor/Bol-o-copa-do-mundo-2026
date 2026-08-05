// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-Y_7_MWkegxmUBG1kjTBlb8vjrUVaCOo",
  authDomain: "copa-do-mundo-2026-e7a8d.firebaseapp.com",
  projectId: "copa-do-mundo-2026-e7a8d",
  storageBucket: "copa-do-mundo-2026-e7a8d.firebasestorage.app",
  messagingSenderId: "971162037231",
  appId: "1:971162037231:web:ed01f91d3bd099c1ee641a",
  measurementId: "G-9TEEWWKX7N"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);