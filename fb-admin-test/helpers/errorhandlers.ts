import { FirebaseError } from 'firebase-admin';

export const tokenInvalideCodes = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token'
];

interface IErrorMsgCode {
  token?: string;
  code: string;
  message: string;
}

const errorsToMsgCodePairs = ({ errors, tokens }: { errors: { err: FirebaseError, ind: number; }[], tokens: string[] | string; }): IErrorMsgCode[] | null => {
  tokens = (Array.isArray(tokens)) ? [...tokens] : [tokens];
  if (errors && tokens && tokens.length) {
    errors = (errors instanceof Array) ? [...errors] : [errors];
    return errors.map((error: { err: FirebaseError | undefined, ind: number; }) => {
      if (error && typeof error !== 'undefined') {
        return { code: error['code'], message: error['message'], token: tokens[error.ind] } as IErrorMsgCode;
      }
    });
  }
  return null;
};


export { IErrorMsgCode, errorsToMsgCodePairs };