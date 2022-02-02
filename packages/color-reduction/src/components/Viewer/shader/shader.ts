import { parseVariables } from 'shared/lib/src/shader';
import fragment from './main.frag';
import vertex from './main.vert';
import subFragment from './sub.frag';
import subVertex from './sub.vert';

const { attribute, uniform, uniLocation } = parseVariables({ vertex, fragment });
const { attribute: subAttribute, uniform: subUniform, uniLocation: subUniLocation } = parseVariables({
  vertex: subVertex,
  fragment: subFragment,
});

export {
  fragment,
  vertex,
  attribute,
  uniform,
  uniLocation,
  subFragment,
  subVertex,
  subAttribute,
  subUniform,
  subUniLocation,
};
