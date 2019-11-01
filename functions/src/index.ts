import { database } from 'firebase-functions';

import * as admin from 'firebase-admin';


// const createUserToken = async (uid: string) => {
//   return await admin.auth().createCustomToken(uid);
// }
const app = admin.initializeApp();

export const pushtouser = database.ref('users/{userId}/isLoggedIn').onUpdate(async (change, ctx) => {
  const isLoggedIn = change.after.val();
  const userId = ctx.params['userId'];

  admin.database(app).ref(`users/${userId}/name`).on('value', (unameSnap, prevChildKey) => {
    let userName = 'Unknown!'
    if (unameSnap && unameSnap.exists()) {
      userName = unameSnap.val() as string;
    }

    // const userId = 'WYOCO90XAuehAb8foA292JE7WgJ3';
    const msgPayload: admin.messaging.MessagingPayload = {
      // data: { userId },
      notification: {
        title: `Hello ${userName}`,
        body: `You logged  :  ${!!isLoggedIn}`
      }
    };

    let tokens: string[] = [];

    admin.database(app).ref(`users/${userId}/pushTokens`).on('value', (snap, prevKey) => {
      if (snap && snap.exists()) {
        tokens = snap.val();
      }

      if (tokens.length) {
        return admin.messaging(app).sendToDevice(tokens, msgPayload).then(messResp => {
          console.log(JSON.stringify(messResp));
        });
      } else {
        return Promise.reject('No token');
      }

    });
  });

});