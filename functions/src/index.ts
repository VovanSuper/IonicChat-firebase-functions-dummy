import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// const createUserToken = async (uid: string) => {
//   return await admin.auth().createCustomToken(uid);
// }
// const app = admin.initializeApp(admin.app().options);
const app = admin.initializeApp(functions.config().firebase);

export const pushLoggedInUserGreet = functions.database.ref('users/{userId}/isLoggedIn').onUpdate(async (change, ctx) => {
  const isLoggedIn: boolean = change.after.exists() && change.after.val() as boolean;
  const { userId } = ctx.params;

  !!isLoggedIn && admin.database(app).ref(`users/${userId}/name`).once('value', (unameSnap, prevChildKey) => {
    let userName = 'Unknown!';
    if (unameSnap && unameSnap.exists()) {
      userName = unameSnap.val() as string;
    }
    console.log(`User ${userName} is ${!!isLoggedIn} ... preparting Push Message ..!`);

    const payload = {
      title: `Hello ${userName}`,
      body: ` ${(!!isLoggedIn) ? 'Wellcome aboard' : 'GoodBye'}`,
      channel: 'Wellcome_Channel',
      userId
    };

    const dataPayload: admin.messaging.DataMessagePayload = {
      'userId': `${payload.userId}`,
      'MessageType': 'Hello_Message'
    };

    const msgPayload: admin.messaging.MessagingPayload = {
      data: dataPayload,
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

    return admin.database(app).ref(`users/${userId}/pushTokens`).once('value', (snap, prevKey) => {
      if (snap && snap.exists()) {
        tokens = Array.isArray(snap.val()) ? [...snap.val()] : [snap.val()];

        if (tokens.length) {
          return admin.messaging(app).sendToDevice(tokens, msgPayload).then((messResp: admin.messaging.MessagingDevicesResponse) => {
            console.log(`Sending Push message to ${userId} (${tokens})`);
            console.log(JSON.stringify(messResp.results));
          });
        } else {
          return Promise.reject(`[pushLoggedInUserGreet] :: NO Tokens provided ..!`);
        }
      } else {
        return Promise.reject(`[pushLoggedInUserGreet] :: NO pushTokens on PATH "users/userID/psuhTokens" provided ..!`);
      }
    });

  });

});