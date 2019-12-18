import { getAllUserNamesTokens } from './helpers/database';
import { sendTestToAllTokens, sendToTopic, assignTokensToTopic, createPushMsg } from './helpers/messaging';
import { register } from './helpers/register';


const app = register();

getAllUserNamesTokens(app).then(userNameTokensMap => {

  const testTopic = `/topics/TESTERS_GENERAL_PUSH_TOPIC`;
  let msg = createPushMsg({
    data: {
      'HELLO': 'Planet'
    },
    title: 'Hi',
    body: 'there ..!'
  });

  let tokens = [];

  console.log('Tokens :: ');
  for (let i in userNameTokensMap) {
    if (userNameTokensMap[i])
      tokens.push(...userNameTokensMap[i]);
  }

  console.log(tokens);

  sendTestToAllTokens({ app, tokens })
    .then(val => {
      val.errors
      process.exit(0);
    });
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


