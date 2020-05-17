import { ApiBuilder } from '../src/index';
import { Request, Response, NextFunction } from 'express';

const req = {} as Request;
const res = {} as Response;

jest.useFakeTimers();

describe('ApiBuilder', () => {

  test('should initialize properly on request', (done) => {
    const Action = jest.fn((context: any) => { });

    const api = new ApiBuilder({});

    api.extend('taskOne', Action);

    api.init(req, res, (e: any) => { })
      .taskOne(done)

    jest.runAllTimers();

    expect(Action).toBeCalledTimes(1);
  });

  test('should run actions in proper sequence', (done) => {
    const Action = jest.fn((context: any) => jest.runOnlyPendingTimers);
    const ActionTwo = jest.fn((context: any) => jest.runOnlyPendingTimers);
    const ActionThree = jest.fn((context: any) => { });

    const api = new ApiBuilder({});

    api.extend('taskOne', Action);
    api.extend('taskTwo', ActionTwo);
    api.extend('taskThree', ActionThree);

    api.init(req, res, (e: any) => { })
      .taskOne((err?: null, res?: any) => {
        if (res) res();
        expect(Action).toBeCalledTimes(1);
        expect(Action).toHaveBeenCalledBefore(ActionTwo);
      })
      .taskTwo((err?: null, res?: any) => {
        if (res) res();
        expect(ActionTwo).toBeCalledTimes(1);
        expect(ActionTwo).toHaveBeenCalledBefore(ActionThree);
      })
      .taskThree(() => {
        done();
        expect(ActionTwo).toBeCalledTimes(1);
      })

    jest.runOnlyPendingTimers();
  });

});
