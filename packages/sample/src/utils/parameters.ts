import { Pane } from 'tweakpane';

export type Parameters = {
  cullFace?: boolean;
  depthTest?: boolean;
  clockWise?: boolean;
  view?: {
    fovy: number;
    near: number;
    far: number;
  };
  light?: {
    position: {
      x: number;
      y: number;
      z: number;
    };
  };
  diffuseLight?: {
    enable: boolean;
  };
  ambientLight?: {
    enable: boolean;
    intensity: number;
  };
  specularLight?: {
    enable: boolean;
    shininess: number;
  };
};

/**
 * 参照元のparametersを変更する
 * @param parameters
 * @param element
 */
export const addParameters = (parameters: Parameters, element: HTMLElement) => {
  const pane = new Pane({ container: element });

  // CULL_FACE
  if ('cullFace' in parameters) {
    pane.addInput({ cullFace: parameters.cullFace }, 'cullFace').on('change', (v) => {
      parameters.cullFace = v.value;
    });
  }

  // DEPTH_TEST
  if ('depthTest' in parameters) {
    pane.addInput({ depthTest: parameters.depthTest }, 'depthTest').on('change', (v) => {
      parameters.depthTest = v.value;
    });
  }

  // DEPTH_TEST
  if ('clockWise' in parameters) {
    pane.addInput({ clockWise: parameters.clockWise }, 'clockWise').on('change', (v) => {
      parameters.clockWise = v.value;
    });
  }

  // pMatrix
  if (parameters.view) {
    const viewOption = pane.addFolder({ title: 'view', expanded: true });
    viewOption
      .addInput({ fovy: parameters.view.fovy }, 'fovy', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.view.fovy = v.value;
      });
    viewOption
      .addInput({ near: parameters.view.near }, 'near', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.view.near = v.value;
      });
    viewOption
      .addInput({ far: parameters.view.far }, 'far', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.view.far = v.value;
      });
  }

  // light
  if (parameters.light) {
    const option = pane.addFolder({ title: 'light', expanded: true });
    option
      .addInput({ position: parameters.light.position }, 'position', {
        x: { step: 0.1 },
        y: { step: 0.1 },
        z: { step: 0.1 },
      })
      .on('change', (v) => {
        parameters.light.position = v.value;
      });
  }

  // diffuseLight
  if (parameters.diffuseLight) {
    const option = pane.addFolder({ title: 'diffuseLight', expanded: true });
    option.addInput({ enable: parameters.diffuseLight.enable }, 'enable').on('change', (v) => {
      parameters.diffuseLight.enable = v.value;
    });
  }

  // ambientLight
  if (parameters.ambientLight) {
    const option = pane.addFolder({ title: 'ambientLight', expanded: true });
    option.addInput({ enable: parameters.ambientLight.enable }, 'enable').on('change', (v) => {
      parameters.ambientLight.enable = v.value;
    });
    option
      .addInput({ intensity: parameters.ambientLight.intensity }, 'intensity', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.ambientLight.intensity = v.value;
      });
  }

  // specularLight
  if (parameters.specularLight) {
    const option = pane.addFolder({ title: 'specularLight', expanded: true });
    option.addInput({ enable: parameters.specularLight.enable }, 'enable').on('change', (v) => {
      parameters.specularLight.enable = v.value;
    });
    option
      .addInput({ shininess: parameters.specularLight.shininess }, 'shininess', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.specularLight.shininess = v.value;
      });
  }

  return pane;
};
