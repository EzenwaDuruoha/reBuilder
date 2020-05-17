import { Request, Response, NextFunction } from 'express';
import { Queue, QueueTaskCallback } from './Queue';

export interface ContextProps<T extends Object> {
  res: object;
};

export interface ApiBuilderOptions<T extends Object> {
};

export interface ActionOptions<T extends Object> {
  breakOnError?: boolean;
  [key: string]: any;
};

export interface Task {
  action: Action,
  actionOptions: ActionOptions<object>
};

export type Action = (context: Context) => void;

export class Context {
  isComplete = false;

  get() { }

  push() { }

  break(error?: Object) { }

  cleanup() { }

  complete() { }

  setValue(value: any) { }
}


export class Frame {
  [key: string]: any;
  private queue: Queue;
  private context: Context;
  dependencies: any = {};

  constructor(request: Request, response: Response, next: NextFunction, dependencies: {}) {
    this.queue = new Queue(this.worker);
    this.context = new Context();
    this.dependencies = dependencies;
  }

  private worker = async (task: Task, done: QueueTaskCallback) => {
    const { action, actionOptions = {} } = task;
    const context = this.getContext();

    if (context.isComplete) return done();
    let result;
    let err;

    try {
      result = await action(context);
    } catch (error) {
      err = error;
    } finally {
      context.cleanup();
      done(err, result);
    }
  }

  private enqueue(action: Action, actionOptions?: ActionOptions<Object>, actionCallback?: QueueTaskCallback) {
    this.queue.push({ action, actionOptions }, async (err, result) => {
      try {
        if (actionCallback) {
          await actionCallback(err, result)
        }
      } catch (error) {}
    })
  }

  getContext() {
    return this.context;
  }

  buildAction(action: Action, actionOptions?: ActionOptions<Object>) {
    return function (this: Frame, cb?: QueueTaskCallback) {
      this.enqueue(action, actionOptions, cb);
      return this;
    };
  }
}

function cloneFrame() {
  return class ScoppedFrame extends Frame {}
}


export class ApiBuilder {
  options: ApiBuilderOptions<Object>;
  dependencies: any = {};
  private ScoppedFrame = cloneFrame();
  private noOfActions = 0;

  constructor(options: ApiBuilderOptions<Object>) {
    this.options = options;
    Object.freeze(this.options);
  }

  init(request: Request, response: Response, next: NextFunction): Frame {
    const frame = new this.ScoppedFrame(request, response, next, this.dependencies);
    return frame;
  }

  extend(actionName: string, action: Action, actionOptions?: ActionOptions<Object>) {
    Object.defineProperty(this.ScoppedFrame.prototype, actionName, {
      value: this.ScoppedFrame.prototype.buildAction(action, actionOptions),
      writable: false,
      enumerable: false,
      configurable: false,
    });
    this.noOfActions++;
    return this;
  }

  addDependency(dependencyName: string, dependency: any) {
    Object.defineProperty(this.dependencies, dependencyName, {
      value: dependency,
      writable: false,
      enumerable: false,
      configurable: false,
    });
    return this;
  }
}
