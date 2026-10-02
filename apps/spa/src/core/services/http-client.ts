import type { Options } from "ky";
import ky from "ky";

export class Http {
  /**
   * @description Ky instance
   */
  instance: typeof ky;
  /**
   * @description Create a new instance of Http service
   * @param {Options} config Ky config options
   */
  constructor(config: Options) {
    this.instance = ky.create(config);
  }
}
