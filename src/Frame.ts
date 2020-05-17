import { NextFunction, Request, Response } from "express";
import { Queue, QueueTaskCallback } from "./Queue";
import { Context } from "./Context";
import { PropertyDict, Task, Action, ActionOptions } from "./types";

export class Frame {
  [key: string]: any;
  private queue: Queue;
  private context: Context;
  dependencies: PropertyDict = {};

  constructor(request: Request, response: Response, next: NextFunction, dependencies: {}) {
    this.queue = new Queue(this.worker);
    this.context = new Context(this, request, response, next);
    this.dependencies = dependencies;
  }

  private worker = async (task: Task, done: QueueTaskCallback) => {
    const { action, actionOptions: { name, breakOnError } } = task;
    const context = this.getContext();
    context.setCurrentStage(name);

    if (context.isComplete) {
      const RequestCompletedErorr = new Error('Request already completed')
      context.break(RequestCompletedErorr);
      return done(RequestCompletedErorr);
    }
    let result;
    let err;

    try {
      result = await action(context);
    } catch (error) {
      err = error;
      if (breakOnError) {
        context.break(error);
      } else {
        context.set('error', error);
      }
    } finally {
      context.cleanup();
      done(err, result);
    }
  }

  flush() {
    this.queue.clear();
  }

  private enqueue(action: Action, actionOptions?: ActionOptions, actionCallback?: QueueTaskCallback) {
    this.queue.push({ action, actionOptions }, async (err, result) => {
      if (actionCallback) {
        await actionCallback(err, result)
      }
    });
  }

  getContext() {
    return this.context;
  }

  buildAction(action: Action, actionOptions?: ActionOptions) {
    return function (this: Frame, cb?: QueueTaskCallback) {
      this.enqueue(action, actionOptions, cb);
      return this;
    };
  }
}
