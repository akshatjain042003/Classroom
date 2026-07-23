export interface User {
  id?: number;
  username: string | null;
  firstname: string;
  lastname: string;
  email: string;
  googleid?: string;
  picture?: string;
  accesstoken?: string;
  createdat?: Date;
  upddate?: Date;
  password?: string | null;
  boards?: Board[];
}

export interface Board {
  boardid: number;
  title: string;
  createdat: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  thickness: number;
}

export interface WhiteboardData {
  userid: {
    firstname: string;
  };
  title: string;
  backgroundcolor: string;
  createdat: string;
  stroke: Stroke[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}
