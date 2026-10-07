export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type StoredUser = AuthUser & {
  salt: string;
  passwordHash: string;
};

export type AuthSession = {
  userId: string;
  email: string;
  token: string;
  createdAt: string;
};
