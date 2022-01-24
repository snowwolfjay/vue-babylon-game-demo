import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { fromEvent, Observable } from 'rxjs';
import { SubTracker } from 'src/shared/page';
import '@babylonjs/core/Rendering/edgesRenderer';

export class AppEngine extends SubTracker {
  private engine: Engine;
  private currentScene: SceneBase;
  private nextScene?: SceneBase;
  private renderFuncs: Array<{ [key: string]: () => void }> = [];
  public paused = false;
  constructor(canvas: HTMLCanvasElement) {
    super();
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    engine.runRenderLoop(() => {
      if (this.paused) return;
      this.sceneUpdate();
      Object.keys(this.renderFuncs).forEach((key) => this.renderFuncs[key]());
    });
    engine.resize();
    this.addClear(
      fromEvent(window, 'resize').subscribe(() => {
        engine.resize();
      })
    );
    this.engine = engine;
    this.addClear(() => engine.dispose());
  }
  start(Scene: SceneBase) {
    this.child('render').clear();
    this.currentScene = Scene.initialize(this.engine);
    this.child('render').addClear(() => {
      this.currentScene?.clear();
    });
    return this.currentScene.getObject();
  }
  pause() {
    this.paused = true;
  }
  sceneUpdate() {
    if (this.nextScene) {
      this.currentScene = this.nextScene;
      this.nextScene = null;
    }
    this.currentScene?.update();
  }
}

interface SceneBase extends SubTracker {
  initialize(engine: Engine): SceneBase;
  update(): void;
  getObject(): Scene;
}

export class SceneDemo extends SubTracker implements SceneBase {
  private core: Scene;
  private engine: Engine;
  initialize(engine: Engine) {
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;

    this.engine = engine;
    this.core = scene;
    this.addClear(() => {
      scene.dispose();
      this.engine = null;
    });
    return this;
  }
  update() {
    this.core.render();
  }
  getObject(): Scene {
    return this.core;
  }
}
