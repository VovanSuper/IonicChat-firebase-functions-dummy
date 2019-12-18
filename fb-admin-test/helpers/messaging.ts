import { messaging, app, FirebaseArrayIndexError, FirebaseError } from 'firebase-admin';
import { errorsToMsgCodePairs, IErrorMsgCode } from './errorhandlers';

export interface IMessageRespose {
  messagingResp: messaging.MessagingConditionResponse | messaging.SendResponse | messaging.MessagingDevicesResponse | messaging.MessagingTopicResponse,
  errors?: IErrorMsgCode[];
}

const createPushMsg = ({ title, body, data }: { title: string, body?: string, data?: messaging.DataMessagePayload | { [key: string]: string; }; }) => {
  return {
    data: data,
    notification: {
      title,
      body,
      color: '#DDCC55'
    }
  } as messaging.MessagingPayload;
};

const sendTestToAllTokens = async ({ app, tokens }: { app: app.App; tokens?: string | string[]; }): Promise<IMessageRespose> => {
  if (!tokens || !tokens.length) {
    throw new Error('Set or single push notifications token should be provided');
  }
  try {
    const messagingResp = await messaging(app).sendToDevice(tokens, {
      data: { foo: 'baz', name: 'Vovan' },
      notification: {
        title: 'hello',
        body: 'Planet'
      }
    });
    let sendToTokensResult: messaging.MessagingDeviceResult[] = messagingResp.results;
    let sendToTokensErrors = sendToTokensResult.map((item, i) => { return (item.error && { err: item.error, ind: i }); });
    let errors = errorsToMsgCodePairs({ errors: sendToTokensErrors, tokens }) as IErrorMsgCode[];

    return { messagingResp, errors };
  }
  catch (e) {
    console.error(e);
  }
  finally { }
};

const assignUserTokensToTopic = async ({ app, tokens, topicName }: { app: app.App; tokens?: string | string[]; topicName: string; } = { app: null, tokens: [], topicName: '' })
  : Promise<{ topicAssignmentResp: messaging.MessagingTopicManagementResponse, errors: IErrorMsgCode[]; }> => {
  if (!app || !tokens || !tokens.length || !topicName.length) throw new Error('app.App shuld be defined, tokens and topicName sould be provided ..! ');

  let topicAssignmentResp: messaging.MessagingTopicManagementResponse = await messaging(app).subscribeToTopic(tokens, topicName);
  let topicAssignErrors: FirebaseArrayIndexError[] = topicAssignmentResp.failureCount && topicAssignmentResp.errors;
  let errors = topicAssignErrors.map(({ error, index }) => <IErrorMsgCode>{ code: error.code, message: error.message, token: tokens[index] });

  return { topicAssignmentResp, errors };
};

const sendToTopic = (app: app.App, assignedTopic: string, message: messaging.MessagingPayload): Promise<IMessageRespose> => {
  return messaging(app).sendToTopic(assignedTopic, message).then(messagingResp => { messagingResp; }) as Promise<IMessageRespose>;
};

export {
  sendTestToAllTokens,
  sendToTopic,
  createPushMsg,
  assignUserTokensToTopic as assignTokensToTopic
};