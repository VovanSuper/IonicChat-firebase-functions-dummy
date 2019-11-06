import admin = require('firebase-admin');

export function register(): admin.app.App {
  const serviceAccount = require('./fcm-key.json');
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}
