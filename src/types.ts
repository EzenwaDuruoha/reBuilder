import { Context } from "./Context";

export interface ContextProps {
  res: object;
};

export interface ApiBuilderOptions {
};

export interface ActionOptions {
  name: string;
  breakOnError?: boolean;
  [key: string]: any;
};

export interface Task {
  action: Action,
  actionOptions: ActionOptions
};

export type Action = (context: Context) => any;

export type OnComplete = (data: any, status: number, type?: string) => void;

export interface PropertyDict {
  [key: string]: any
}

export interface StageStore {
  [key: string]: {
    error?: Error | undefined
    [key: string]: any
  }
}
