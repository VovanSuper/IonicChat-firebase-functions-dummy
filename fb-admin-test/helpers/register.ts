import { app, initializeApp, credential } from 'firebase-admin';

export const register = (): app.App => {
  const serviceAccount = require('../fcm-key.json');
  return initializeApp({
    credential: credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}
