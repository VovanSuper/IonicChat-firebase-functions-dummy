import * as admin from 'firebase-admin';

interface IUser {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  pushTokens: string[];
}

const getAllUserNamesTokens = (app: admin.app.App): Promise<Map<string, string[]>> => new Promise((resolve, reject) => {
  admin.database(app).ref('users/').on('value', (snap: admin.database.DataSnapshot) => {
    let results: Map<string, string[]> = new Map();
    // let users: IUser[] = [];
    snap.forEach(item => {
      // users.push(item.val());
      results[item.key] = item.child('pushTokens').hasChildren() && !!(item.child('pushTokens').val()) && item.child('pushTokens').val();
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
})

const getUserPushTokens = ({ app, userId }: { app: admin.app.App; userId: string; }): Promise<string[]> => {
  if (!userId || !userId.length) { throw new Error('Provided valid UserId..!:') }

  return new Promise((resolve, reject) => {
    admin.database(app).ref(`users/${userId}/pushTokens`).on('value', (tokensSnapshot, _prevKey) => {
      if (!tokensSnapshot) {
        return reject('No tokens');
      }
      let tokens = (tokensSnapshot.val() instanceof Array) ? [...tokensSnapshot.val()] : [tokensSnapshot.val()];
      console.log(`All user FCM Tokens ::: ${JSON.stringify(tokens)}`);
      return resolve(tokens);
    })
  });
}

const deleteFailedTokens = (app: admin.app.App, tokens: string[] | string) => {
  tokens = (Array.isArray(tokens)) ? [...tokens] : [tokens];
  let refs = tokens.map(token => {
    let ref = admin.database(app).ref(`users/`).on('value', usersSnapshot => {
      usersSnapshot.forEach(userSnapshot => {
        userSnapshot.child('pushTokens').hasChildren()
      })
    })
    // .child('pushTokens').orderByValue().equalTo(token);
    // ref.on('value', (tokenSnapshot: admin.database.DataSnapshot) => {
    //   tokenSnapshot.ref.remove();
    // })
  })
}

export {
  IUser,
  getAllUserNamesTokens,
  getUserPushTokens,
  deleteFailedTokens
};