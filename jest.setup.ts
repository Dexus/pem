/*
 * Copyright (c) 2022. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
 * Morbi non lorem porttitor neque feugiat blandit. Ut vitae ipsum eget quam lacinia accumsan.
 * Etiam sed turpis ac ipsum condimentum fringilla. Maecenas magna.
 * Proin dapibus sapien vel ante. Aliquam erat volutpat. Pellentesque sagittis ligula eget metus.
 * Vestibulum commodo. Ut rhoncus gravida arcu.
 */


expect.extend({
  toBeType(received: any, argument: string): any {
    const initialType = typeof received
    const type = initialType === "object" ? Array.isArray(received) ? "array" : initialType : initialType
    return type === argument ? {
      message: () => `expected ${received} to be type ${argument}`,
      pass: true
    } : {
      message: () => `expected ${received} to be type ${argument}`,
      pass: false
    }
  }
})


