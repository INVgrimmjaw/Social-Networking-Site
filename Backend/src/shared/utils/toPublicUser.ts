export interface UserRecord {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  createdAt: string;
}

/** Safe to show to anyone. Never includes email or password. */
export const toPublicUser = (user: UserRecord) => ({
  id: user.id,
  username: user.username,
  name: user.name ?? null,
  createdAt: user.createdAt,
});

/** For the logged-in user's own responses (adds email). */
export const toSelfUser = (user: UserRecord) => ({
  ...toPublicUser(user),
  email: user.email,
});

export const toTokenPayload = (user: UserRecord) => ({
  id: user.id,
  name: user.name ?? "",
  email: user.email,
});