// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyBQRWltCQXRrtYB39lzqSxDt2H90O11h8Q",
    authDomain: "final-year-project-cebde.firebaseapp.com",
    projectId: "final-year-project-cebde",
    storageBucket: "final-year-project-cebde.firebasestorage.app",
    messagingSenderId: "511943875806",
    appId: "1:511943875806:web:b2931203c660500809b64f",
    measurementId: "G-Y6V7PGMWP5",
    databaseURL: "https://final-year-project-cebde-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const analytics = getAnalytics(app);

console.log('Firebase initialized successfully');

export { app, auth, db, rtdb, analytics }; 