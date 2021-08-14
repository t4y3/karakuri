import Tweakpane from 'tweakpane';

export type Parameters = {
  cullFace?: boolean;
  depthTest?: boolean;
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
  }
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
  const Pane = new Tweakpane({ container: element });

  // CULL_FACE
  if ('cullFace' in parameters) {
    Pane.addInput({ cullFace: parameters.cullFace }, 'cullFace').on('change', (v) => {
      parameters.cullFace = v;
    });
  }

  // DEPTH_TEST
  if ('depthTest' in parameters) {
    Pane.addInput({ depthTest: parameters.depthTest }, 'depthTest').on('change', (v) => {
      parameters.depthTest = v;
    });
  }

  // pMatrix
  if (parameters.view) {
    const viewOption = Pane.addFolder({ title: 'view', expanded: true });
    viewOption
      .addInput({ fovy: parameters.view.fovy }, 'fovy', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.view.fovy = v;
      });
    viewOption
      .addInput({ near: parameters.view.near }, 'near', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.view.near = v;
      });
    viewOption
      .addInput({ far: parameters.view.far }, 'far', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.view.far = v;
      });
  }

  // light
  if (parameters.light) {
    const option = Pane.addFolder({ title: 'light', expanded: true });
    option
      .addInput({ position: parameters.light.position }, 'position', {
        x: { step: 0.1 },
        y: { step: 0.1 },
        z: { step: 0.1 },
      })
      .on('change', (v) => {
        parameters.light.position = v;
      });
  }

  // diffuseLight
  if (parameters.diffuseLight) {
    const option = Pane.addFolder({ title: 'diffuseLight', expanded: true });
    option.addInput({ enable: parameters.diffuseLight.enable }, 'enable').on('change', (v) => {
      parameters.diffuseLight.enable = v;
    });
  }

  // ambientLight
  if (parameters.ambientLight) {
    const option = Pane.addFolder({ title: 'ambientLight', expanded: true });
    option.addInput({ enable: parameters.ambientLight.enable }, 'enable').on('change', (v) => {
      parameters.ambientLight.enable = v;
    });
    option
      .addInput({ intensity: parameters.ambientLight.intensity }, 'intensity', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.ambientLight.intensity = v;
      });
  }

  // specularLight
  if (parameters.specularLight) {
    const option = Pane.addFolder({ title: 'specularLight', expanded: true });
    option
      .addInput({ enable: parameters.specularLight.enable }, 'enable')
      .on('change', (v) => {
        parameters.specularLight.enable = v;
      });
    option
      .addInput({ shininess: parameters.specularLight.shininess }, 'shininess', {
        step: 0.1,
      })
      .on('change', (v) => {
        parameters.specularLight.shininess = v;
      });
  }
};
