import * as admin from 'firebase-admin';
import { errorsToMsgCodePairs, IErrorMsgCode } from './errorhandlers';

export interface IMessageRespose {
  messagingResp: admin.messaging.MessagingConditionResponse | admin.messaging.SendResponse | admin.messaging.MessagingDevicesResponse | admin.messaging.MessagingTopicResponse,
  errors?: IErrorMsgCode[]
}

const createPushMsg = ({ title, body, data }: { title: string, body?: string, data?: admin.messaging.DataMessagePayload | object }) => {
  return {
    data: data,
    notification: {
      title,
      body,
      color: '#DC5'
    }
  } as admin.messaging.MessagingPayload;
}

const sendTestToAllTokens = async ({ app, tokens }: { app: admin.app.App; tokens?: string | string[]; }): Promise<IMessageRespose> => {
  if (!tokens || !tokens.length) {
    throw new Error('Set or single push notifications token should be provided');
  }
  try {
    const messagingResp = await admin.messaging(app).sendToDevice(tokens, {
      data: { foo: 'baz', name: 'Vovan' },
      notification: {
        title: 'hello',
        body: 'Planet'
      }
    });
    let results = messagingResp.results;
    let deviceRes = results.map((item, i) => { return { err: item.error, ind: i } });
    let errors = errorsToMsgCodePairs(deviceRes, tokens) as IErrorMsgCode[];

    return { messagingResp, errors };
  }
  catch (e) {
    console.debug(e);
  }
  finally { }
}

const assignUserTokensToTopic = async (
  app: admin.app.App,
  tokens: string[], topicName: string
): Promise<{ topicAssignmentResp: admin.messaging.MessagingTopicManagementResponse, errors: IErrorMsgCode[] }> => {

  let topicAssignmentResp: admin.messaging.MessagingTopicManagementResponse = await admin.messaging(app).subscribeToTopic(tokens, topicName);
  let topicAssignErrors: admin.FirebaseArrayIndexError[] = topicAssignmentResp.failureCount && topicAssignmentResp.errors;
  let errors = topicAssignErrors.map(({ error, index }) => <IErrorMsgCode>{ code: error.code, message: error.message, token: tokens[index] });

  return { topicAssignmentResp, errors };
}

const sendToTopic = (app: admin.app.App, assignedTopic: string, message: admin.messaging.MessagingPayload): Promise<IMessageRespose> => {
  return admin.messaging(app).sendToTopic(assignedTopic, message).then(messagingResp => { messagingResp }) as Promise<IMessageRespose>;
}

export {
  sendTestToAllTokens,
  sendToTopic,
  createPushMsg,
  assignUserTokensToTopic as assignTokensToTopic
};