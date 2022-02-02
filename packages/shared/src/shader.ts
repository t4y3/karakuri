type Args = {
  vertex: string;
  fragment: string;
};

type Return = {
  attribute: {
    variable: string;
    type: string;
    attStride: number;
  }[];
  uniform: {
    variable: string;
    type: string;
  }[];
  uniLocation: {};
};

const stride = (type: string) => {
  if (type === 'bool') {
    return 1;
  }
  return Number(type[type.length - 1]);
};

export const parseVariables = ({ vertex, fragment }: Args): Return => {
  const attribute = [];
  const uniform = [];
  const uniLocation = {};

  // 変数宣言部分を抽出する正規表現
  const attributeReg = /attribute (?<type>.*) (?<variable>.*);/;
  const uniformReg = /uniform (?<type>.*) (?<variable>.*);/;

  // vertexShader
  vertex.split('\n').forEach((row) => {
    const foundAttribute = row.match(attributeReg);
    if (!!foundAttribute) {
      const { variable, type } = foundAttribute.groups;
      attribute.push({
        variable,
        type,
        attStride: stride(type),
      });
    }

    const foundUniform = row.match(uniformReg);
    if (!!foundUniform) {
      const { variable, type } = foundUniform.groups;
      uniform.push({
        variable,
        type,
      });
      uniLocation[variable] = null;
    }
  });

  // fragmentShader
  fragment.split('\n').forEach((row) => {
    const foundUniform = row.match(uniformReg);
    if (!!foundUniform) {
      const { variable, type } = foundUniform.groups;
      uniform.push({
        variable,
        type,
      });
      uniLocation[variable] = null;
    }
  });

  return {
    attribute,
    uniform,
    uniLocation,
  };
};
