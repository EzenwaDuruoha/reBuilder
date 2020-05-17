import { APIBuilder } from '../src/index';
import { Request, Response, NextFunction } from 'express';

const req = {} as Request;
const res = {} as Response;

jest.useFakeTimers();

describe('APIBuilder', () => {

  test('should initialize properly on request', (done) => {
    const mock1 = jest.fn();
    const mock2 = jest.fn();
    const mock3 = jest.fn();
    const api = new APIBuilder({});

    api.extend('taskOne', (context) => {
      console.log('taskOne');
      mock1('taskOne');
    });

    api.extend('taskTwo', (context) => {
      console.log('taskTwo');
      mock2('taskTwo');
    });

    api.extend('taskThree', (context) => {
      console.log('taskThree');
      mock3('taskThree');
    });

    api.init(req, res, (e: any) => console.log(e))
      .taskOne()
      .taskTwo()
      .taskThree(done);

    jest.runAllTimers();

    expect(mock1).toHaveBeenCalledBefore(mock2);
    expect(mock2).toHaveBeenCalledBefore(mock3);
  });

});
