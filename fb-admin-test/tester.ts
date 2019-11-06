import * as admin from 'firebase-admin';
import { getAllUserNamesTokens } from './helpers/database';
import { sendTestToAllTokens, sendToTopic, assignTokensToTopic, createPushMsg } from './helpers/messaging';
import { register } from './register';


let app = register();

getAllUserNamesTokens(app).then(userNameTokensMap => {

  const testTopic = `/topics/_TESTERS_GENEREL_PUSH_TOPIC`;
  let msg = createPushMsg({
    data: {
      'HELLO': 'Planet'
    },
    title: 'Hi',
    body: 'there ..!'
  });

  let allTokens = [];

  console.log('Tokens :: ');
  for (let i in userNameTokensMap) {
    if (userNameTokensMap[i])
      allTokens.push(...userNameTokensMap[i])
  }

  console.log(allTokens);

  sendTestToAllTokens({ app, tokens: allTokens }).then(_ => process.exit(0));
  // assignTokensToTopic(app, allTokens, testTopic)
  //   .then(assignResult => {
  //     if (assignResult.errors) {
  //       console.log(assignResult.errors);
  //     }
  //     sendToTopic(app, testTopic, { ...testMsg }).then(topicResp => {
  //       console.log(`Sent message ::   ${topicResp.messageId}`);
  //       process.exit(0);
  //     });
  //   }).catch(err => {
  //     console.log(JSON.stringify(err));
  //   });
});


