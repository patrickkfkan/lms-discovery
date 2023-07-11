import { default as main } from './index.js';
import * as discovery from './index.js';

export = Object.assign(main, { ...discovery });
