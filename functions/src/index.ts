import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// const createUserToken = async (uid: string) => {
//   return await admin.auth().createCustomToken(uid);
// }
const app = admin.initializeApp();

export const pushLoggedInUserGreet = functions.database.ref('users/{userId}/isLoggedIn').onUpdate(async (change, ctx) => {
  const isLoggedIn: boolean = change.after.exists() && change.after.val() as boolean;
  const { userId } = ctx.params;

  isLoggedIn && admin.database(app).ref(`users/${userId}/name`).once('value', (unameSnap, prevChildKey) => {
    let userName = 'Unknown!';
    if (unameSnap && unameSnap.exists()) {
      userName = unameSnap.val() as string;
    }

    const payload = {
      title: `Hello ${userName}`,
      body: `You are ${(!!isLoggedIn) ? 'loged in' : 'logged out'}`,
      channel: 'Default_Channel',
      userId
    };

    const msgPayload: admin.messaging.MessagingPayload = {
      data: { userId: payload.userId },
      notification: {
        title: payload.title,
        body: payload.body,
        tag: payload.channel
      }
    };
    // const notificationPaylod: admin.messaging.ApnsPayload = {
    //   aps: {
    //     alert: {
    //       title: payload.title,
    //       body: payload.body
    //     },
    //     threadId: payload.channel
    //   }
    // };

    let tokens: string[] = [];

    admin.database(app).ref(`users/${userId}/pushTokens`).once('value', (snap, prevKey) => {
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