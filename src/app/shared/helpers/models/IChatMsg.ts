export interface IChatMsg {
  // pushID?: string;
  message?: string;
  date?: string | Date;
  from?: string;
  to?: string;
  isSelfMsg?: boolean
}