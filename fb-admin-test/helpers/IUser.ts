interface IUser {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  pushTokens: string[];
}
