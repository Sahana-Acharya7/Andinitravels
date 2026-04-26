const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function deleteAllBookings() {
  try {
    console.log('Starting to delete all bookings...');
    
    const snapshot = await db.collection('bookings').get();
    console.log(`Found ${snapshot.size} bookings to delete`);
    
    if (snapshot.size === 0) {
      console.log('No bookings to delete.');
      process.exit(0);
    }
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Successfully deleted ${snapshot.size} bookings!`);
    process.exit(0);
  } catch (error) {
    console.error('Error deleting bookings:', error);
    process.exit(1);
  }
}

deleteAllBookings();
