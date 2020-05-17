import { NextFunction, Request, Response} from "express";
import { PropertyDict, StageStore } from "./types";
import { Frame } from "./Frame";


export class Context {
  isComplete = false;
  originalRequest: Request & PropertyDict;
  originalResponse: Response;
  private originalNext: NextFunction;
  private frame: Frame;
  private stages: StageStore = {};
  private currentStage: string = '';

  constructor(frame: Frame, originalRequest: Request, originalResponse: Response, originalNext: NextFunction) {
    this.originalRequest = originalRequest;
    this.originalResponse = originalResponse;
    this.originalNext = originalNext;
    this.frame = frame;
  }

  get(key: string): any | undefined {
    return this.originalRequest?.[key];
  }

  set(key: string, value: any) {
    if (!this.stages[this.currentStage]) {
      this.stages[this.currentStage] = {};
    }
    this.stages[this.currentStage][key] = value;
  }

  private end () {
    this.isComplete = true;
    this.frame.flush();
  }

  break(error?: Error | null) {
    this.end()
    if (!error) {
      error = new Error('Force Break Triggered');
    }
    this.originalNext(error);
  }

  get body() {
    return this.originalRequest?.body;
  }

  get query() {
    return this.originalRequest?.query;
  }

  get params() {
    return this.originalRequest?.params;
  }

  getDependency(key: string) {
    return this.frame.dependencies?.[key];
  }

  setCurrentStage(stage: string) {
    this.currentStage = stage;
  }

  getStageStats(stage: string) {
    this.stages[stage];
  }

  cleanup() { }

  complete(data: any, status: number = 200, type?: string) {
    this.end();
    if (this.frame.complete) {
      return this.frame.complete(data, status, type);
    }
    const res = this.originalResponse.status(status);
    if (type === 'json') {
      return res.json(data);
    }
    return res.send(data);
  }
}