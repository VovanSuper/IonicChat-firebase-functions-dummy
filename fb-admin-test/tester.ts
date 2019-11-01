import * as admin from 'firebase-admin';
// const admin = require('firebase-admin');

const testUserId = 'WYOCO90XAuehAb8foA292JE7WgJ3';
register();
getUserPushTokens(testUserId)
  .then(tokens => sendTestToAllTokens(tokens))
  .catch(err => console.error(err));

const tokenInvalideCodes = [
  'messaging/registration-token-not-registered'
]

function register() {
  const serviceAccount = require('./fcm-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

function sendTestToAllTokens(
  tokens?: string | string[]
) {
  if (!tokens || !tokens.length) {
    throw new Error('Set or single push notifications token should be provided');
  }

  admin.messaging().sendToDevice(tokens, {
    // data: { foo: 'baz', name: 'Vovan' },
    notification: {
      title: "hello",
      body: "Planet"
    }
  })
    .then(msgResp => {
      let results = msgResp.results;
      let errors = results.map(item => item.error);
      if (errors && errors.length) {
        throw errors.map((err: admin.FirebaseError | undefined) => {
          if (err && typeof err !== 'undefined') {
            return { code: err['code'], message: err['message'] }
          }
          return null;
        });
      }

      process.exit(0);
    })
    .catch((errs: { code?: string, message?: string }[] = [{ code: undefined, message: undefined }]) => {
      if (errs instanceof Array) {
        errs.forEach(err => {
          if (err && err.code && err.code.includes(tokenInvalideCodes[0])) {
            console.warn(`Unregistered token..!`);
          }
        });
      }
      console.log(JSON.stringify(errs, null, 2));
      process.exit(0);
    })
}

function getUserPushTokens(userId: string): Promise<string[]> {
  if (!userId || !userId.length) { throw new Error('Provided valid UserId..!:') }

  return new Promise((resolve, reject) => {
    admin.database().ref(`users/${userId}/pushTokens`).on('value', (tokensSnapshot, _prevKey) => {
      if (!tokensSnapshot) {
        return reject('No tokens');
      }
      let tokens = (tokensSnapshot.val() instanceof Array) ? [...tokensSnapshot.val()] : [tokensSnapshot.val()];
      console.log(`All user FCM Tokens ::: ${JSON.stringify(tokens)}`);
      return resolve(tokens);
    })
  })
}


// function pushtouser() {
//   // admin.database().ref('users').child('{uid}/isLoggedIn').on('')
//   admin.database().ref('users/{uid}/isLoggedIn').on('value', (change, ctx) => {
//     const isLoggedIn = change.after.val();
//     const userId = ctx.params['uid'];
//     const msgPayload: admin.messaging.MessagingPayload = {
//       notification: {
//         title: 'Hello',
//         body: 'You logged in / out : ' + isLoggedIn
//       }
//     }
//     let tokens: string[] = [];

//     admin.database().ref(`users/${userId}/pushTokens`).orderByValue().on('value', (snap, prevKey) => {
//       if (snap && snap.exists()) {
//         tokens = snap.val();
//       }

//       if (tokens.length) {
//         return admin.messaging(app).sendToDevice(tokens, msgPayload).then(messResp => {
//           console.log(JSON.stringify(messResp));
//         });
//       }
//       return admin.messaging().sendToDevice([
//         'c4U2ka76swc:APA91bGJrFoBylMcwqqK7T0oZ_pO-1kk3kZvfF1X1ncFHDdtruc9_1TOpxi_W-ita7P6liloW0C1N5OzTm9VhSWClX7gR6cE1ENJyy46bOq0d3ZdK4gxarqvB8wd0r_pG79URYzkqc6o',
//         'cUdXG_-DalU:APA91bEbcmP1iF_zwg8ob0qbqSjQPziOE8bFNY4OKokza5qD16zB0Ncfzeikk9vSqzSFllylOrSjYYut_6Hj09_beG5wFViheJYWA7tQIQPPa48ZepfKqo4JS3lyaHxbHH03WYQtLuQC'
//       ], msgPayload);
//     });

//   });

// } 