import { queue, AsyncQueue, ErrorCallback } from 'async';
import { Request, Response, NextFunction } from 'express';

export interface ContextProps<T extends Object> {
  res: object;
};

export interface APIBuilderOptions<T extends Object> {
};

export interface ActionOptions<T extends Object> {
  breakOnError?: boolean;
};

export interface Task {
  action: Action,
  actionOptions: ActionOptions<object>,
  actionCallback?: ActionCallback
};

export type Action = (context: Context) => void;

export type ActionCallback = () => void;

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
  private queue: AsyncQueue<any>;
  private context: Context;
  dependencies: any = {};

  constructor(request: Request, response: Response, next: NextFunction, dependencies: {}) {
    this.queue = queue(this.worker, 1);
    this.context = new Context();
    this.dependencies = dependencies;
  }

  private worker = async (task: Task, done: ErrorCallback) => {
    const { action, actionOptions = {}, actionCallback } = task;
    const context = this.getContext();

    if (context.isComplete) return done();

    try {
      await action(context);
    } catch (error) {
      if (actionOptions.breakOnError) {
        context.break(error);
      } else {
        context.setValue(error);
      }
    } finally {
      context.cleanup();
      if (actionCallback) {
        process.nextTick(actionCallback)
      }
      done();
    }
  }

  private addToQueue(action: Action, actionOptions?: ActionOptions<Object>, actionCallback?: ActionCallback) {
    this.queue.push({ action, actionOptions, actionCallback })
  }

  getContext() {
    return this.context;
  }

  buildAction(action: Action, actionOptions?: ActionOptions<Object>) {
    return function (this: Frame, cb?: ActionCallback) {
      this.addToQueue(action, actionOptions, cb);
      return this;
    };
  }
}


export class APIBuilder {
  options: APIBuilderOptions<Object>;
  dependencies: any = {};

  constructor(options: APIBuilderOptions<Object>) {
    this.options = options;
    Object.freeze(this.options);
  }

  init(request: Request, response: Response, next: NextFunction): Frame {
    const frame = new Frame(request, response, next, this.dependencies);
    return frame;
  }

  extend(actionName: string, action: Action, actionOptions?: ActionOptions<Object>) {
    Object.defineProperty(Frame.prototype, actionName, {
      value: Frame.prototype.buildAction(action, actionOptions),
      writable: false,
      enumerable: false,
      configurable: false,
    });
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
