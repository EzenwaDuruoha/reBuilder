import { Request, Response, NextFunction } from 'express';
import { Frame } from './Frame';
import { ApiBuilderOptions, PropertyDict, Action, ActionOptions, OnComplete } from './types';

function cloneFrame() {
  return class ScoppedFrame extends Frame { }
}

export class ApiBuilder {
  options: ApiBuilderOptions;
  dependencies: PropertyDict = {};
  private ScoppedFrame = cloneFrame();

  constructor(options: ApiBuilderOptions) {
    this.options = options;
    Object.freeze(this.options);
  }

  init(request: Request, response: Response, next: NextFunction): Frame {
    const frame = new this.ScoppedFrame(request, response, next, this.dependencies);
    return frame;
  }

  extend(actionName: string, action: Action, actionOptions: ActionOptions = {name: ''}) {
    if (!actionOptions.name) actionOptions.name = actionName
    Object.defineProperty(this.ScoppedFrame.prototype, actionName, {
      value: this.ScoppedFrame.prototype.buildAction(action, actionOptions),
      writable: false,
      enumerable: false,
      configurable: false,
    });
    return this;
  }

  setCompleteHandler(handler: OnComplete) {
    if (typeof handler === 'function') {
      Object.defineProperty(this.ScoppedFrame.prototype, 'complete', {
        value: handler,
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }
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
