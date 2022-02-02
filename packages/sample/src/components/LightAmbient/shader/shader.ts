import { parseVariables } from 'shared/lib/src/shader';
import fragment from './main.frag';
import vertex from './main.vert';

const {
  attribute,
  uniform,
  uniLocation
} = parseVariables({ vertex, fragment })

export { fragment, vertex, attribute, uniform, uniLocation };
