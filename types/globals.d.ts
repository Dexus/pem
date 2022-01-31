/******************************************************************************
 * Copyright (c) 2022. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
 * Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.           *
 * Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
 * Vestibulum commodo. Ut rhoncus gravida arcu.                               *
 ******************************************************************************/
/// <reference types="jest" />
//  <reference types="jest-extended" />
import "jest-chain"

export {}

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace jest {

    // noinspection JSUnusedGlobalSymbols
    // eslint-disable-next-line no-unused-vars
    interface Matchers<R> {
      /**
       * .toBeType("string")
       *
       * @param {string} type
       */
      // eslint-disable-next-line no-unused-vars
      toBeType(type: string): R;
    }

    // noinspection JSUnusedGlobalSymbols
    // eslint-disable-next-line no-unused-vars
    interface Expect {
      /**
       * .toBeType("string")
       *
       * @param {string} type
       */
      // eslint-disable-next-line no-unused-vars
      toBeType(type: string): any;

    }
  }
}
