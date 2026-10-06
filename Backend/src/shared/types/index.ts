export interface IUser {
  id: number;
  name: string;
  email: string;
}

export interface IJwtUserPayload {
  id: number;
  name: string;
  email: string;
}

export type ToolExecutor = (userId: number, args: any) => Promise<any>;