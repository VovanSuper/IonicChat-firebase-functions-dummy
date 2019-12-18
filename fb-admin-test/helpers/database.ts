import { database, app } from 'firebase-admin';

const getAllUserNamesTokens = (app: app.App): Promise<Map<string, string[]>> => new Promise((resolve, reject) => {
  database(app).ref('users/').on('value', (snap: database.DataSnapshot) => {
    let results: Map<string, string[]> = new Map();
    snap.forEach(item => {
      results[item.key] = !!(item.child('pushTokens').val()) && item.child('pushTokens').hasChildren() && item.child('pushTokens').val();
    });
    // let tokens: string[] = [];
    // users.forEach(usr => {
    //   if (usr && usr.pushTokens)
    //     tokens.push(...usr.pushTokens)
    // })
    // console.log(tokens);
    // console.log(results)
    resolve(results);
  });
});

const getUserPushTokens = ({ app, userId }: { app: app.App; userId: string; }): Promise<string[]> => {
  if (!userId || !userId.length) { throw new Error('Provided valid UserId..!:'); }

  return new Promise((resolve, reject) => {
    database(app).ref(`users/${userId}/pushTokens`).on('value', (tokensSnapshot, _prevKey) => {
      if (!tokensSnapshot) {
        return reject('No tokens');
      }
      let tokens = (Array.isArray(tokensSnapshot.val())) ? [...tokensSnapshot.val()] : [tokensSnapshot.val()];
      console.log(`All user FCM Tokens ::: ${JSON.stringify(tokens)}`);
      return resolve(tokens);
    });
  });
};

const removeTokens = ({ app, tokens }: { app: app.App, tokens: string[] | string; } = { app: null, tokens: [] }) => {
  if (!app || !tokens.length) throw new Error('app.App should be defined; tokens should be provided..!');

  tokens = (Array.isArray(tokens)) ? [...tokens] : [tokens];
  try {
    database(app).ref(`users/`).once('value',
      usersSnapshot => {
        usersSnapshot.forEach(userSnapshot => {
          const userPushTokensRef = usersSnapshot.child('pushTokens');
          const allUserTokens = userPushTokensRef.exists() && userPushTokensRef.hasChildren() && userPushTokensRef.val() as string[] | null;
          allUserTokens && allUserTokens.length && allUserTokens.forEach(uToken =>
            tokens.includes(uToken) &&
            userPushTokensRef.ref.child(uToken).remove(err => {
              if (err) {
                throw err;
              }
            })
          );
        });
      },
      err => { throw err; });
  } catch (e) {
    console.error(e);
  }
};

export {
  getAllUserNamesTokens,
  getUserPushTokens,
  removeTokens as deleteFailedTokens
};