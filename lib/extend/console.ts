import Promise from 'bluebird';
import abbrev from 'abbrev';
import type { NodeJSLikeCallback } from '../types';

type Option = Partial<{
  usage: string;
  desc: string;
  init: boolean;
  arguments: {
      name: string;
      desc: string;
    }[];
  options: {
    name: string;
    desc: string;
  }[];
}>

interface Args {
  _: string[];
  [key: string]: string | boolean | string[];
}
type AnyFn = (args: Args, callback?: NodeJSLikeCallback<any>) => any;
interface StoreFunction extends AnyFn {
  desc?: string;
  options?: Option;
}

interface Store {
  [key: string]: StoreFunction
}
interface Alias {
  [abbreviation: string]: string
}

class Console {
  public store: Store;
  public alias: Alias;

  constructor() {
    this.store = {};
    this.alias = {};
  }

  /**
   * Get a console plugin function by name
   * @param {String} name - The name of the console plugin
   * @returns {StoreFunction} - The console plugin function
   */
  get(name: string): StoreFunction {
    name = name.toLowerCase();
    return this.store[this.alias[name]];
  }

  list(): Store {
    return this.store;
  }

  /**
   * Register a console plugin
   * @param {String} name - The name of console plugin to be registered
   * @param {String} desc - More detailed information about a console command
   * @param {Option} options - The description of each option of a console command
   * @param {AnyFn} fn - The console plugin to be registered
   */
  register(name: string, fn: AnyFn): void
  register(name: string, desc: string, fn: AnyFn): void
  register(name: string, options: Option, fn: AnyFn): void
  register(name: string, desc: string, options: Option, fn: AnyFn): void
  register(name: string, desc: string | Option | AnyFn, options?: Option | AnyFn, fn?: AnyFn): void {
    if (!name) {
      throw new TypeError('name is required');
    }

    // Guard clause: Si no hay función, ajustamos las opciones y la función
    if (!fn) {
      if (!options) {
        if (typeof desc !== 'function') {
          throw new TypeError('fn must be a function');
        }
        fn = desc;
        options = {};
        desc = '';
      } else if (typeof options === 'function') {
        fn = options;
        options = typeof desc === 'object' ? desc : {};
        desc = typeof desc === 'object' ? '' : desc;
      } else {
        throw new TypeError('fn must be a function');
      }
    }

    // Promisificar si la función tiene más de un argumento
    fn = fn.length > 1 ? Promise.promisify(fn) : Promise.method(fn);

    // Almacenar la función en el store
    const c = fn as StoreFunction;
    this.store[name.toLowerCase()] = c;
    c.options = options as Option;
    c.desc = desc as string;

    // Actualizar alias
    this.alias = abbrev(Object.keys(this.store));
  }
}

export = Console;

