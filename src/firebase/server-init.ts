import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: DO NOT MODIFY THIS FILE
// This file is used for server-side Firebase initialization.

export function initializeFirebase() {
  if (!getApps().length) {
    initializeApp();
  }
  return {
    firebaseApp: getApp(),
    auth: getAuth(),
    firestore: getFirestore(),
  };
}
