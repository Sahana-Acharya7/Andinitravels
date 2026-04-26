import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: 'AIzaSyDQhcU0ie7MidUXpzkbBfIq1zKvzoQoOFU',
  authDomain: 'andini-travels.firebaseapp.com',
  projectId: 'andini-travels',
  storageBucket: 'andini-travels.firebasestorage.app',
  messagingSenderId: '492628587830',
  appId: '1:492628587830:web:66d95e1079444b0975af97',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const driverCreationApp =
  getApps().find(existingApp => existingApp.name === 'driver-creation') ||
  initializeApp(firebaseConfig, 'driver-creation')

export const db = getFirestore(app)
export const auth = getAuth(app)
export const driverCreationAuth = getAuth(driverCreationApp)
