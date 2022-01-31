/*
/!******************************************************************************
 * Copyright (c) 2022. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
 * Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.           *
 * Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
 * Vestibulum commodo. Ut rhoncus gravida arcu.                               *
 ******************************************************************************!/
/// <reference types="jest" />
//  <reference types="jest-extended" />
export {}

declare global {
  namespace jest {

    interface matchers<R> {
      /!**
       * .toBeType("string")
       *
       * @param {string} type
       *!/
      toBeType(type: string): R;
    }

    // noinspection JSUnusedGlobalSymbols
    interface Matchers<R> {
      /!**
       * .toBeType("string")
       *
       * @param {string} type
       *!/
      toBeType(type: string): R;
    }

    // noinspection JSUnusedGlobalSymbols
    interface JestMatchers<T> {
      /!**
       * .toBeType("string")
       *
       * @param {string} type
       *!/
      toBeType(type: string): T;
    }

    // noinspection JSUnusedGlobalSymbols
    interface Expect {
      /!**
       * .toBeType("string")
       *
       * @param {string} type
       *!/
      toBeType(type: string): any;

    }
  }
}
*/
