// Common types for the application
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AppState {
  isLoading: boolean;
  user: User | null;
}

export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};
