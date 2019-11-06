import * as admin from 'firebase-admin';

export const tokenInvalideCodes = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
];

interface IErrorMsgCode {
  token?: string;
  code: string;
  message: string;
}

const errorsToMsgCodePairs = (errors: { err: admin.FirebaseError, ind: number }[], tokens: string[] | string) => {
  tokens = (Array.isArray(tokens)) ? [...tokens] : [tokens];
  if (errors && tokens) {
    errors = (errors instanceof Array) ? [...errors] : [errors];
    return errors.map((error: { err: admin.FirebaseError | undefined, ind: number }) => {
      if (error && typeof error !== 'undefined') {
        return { code: error['code'], message: error['message'], token: tokens[error.ind] } as IErrorMsgCode;
      }
    });
  }
}


export { IErrorMsgCode, errorsToMsgCodePairs };