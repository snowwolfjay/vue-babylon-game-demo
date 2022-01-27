import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { fromEvent } from "rxjs";
import "@babylonjs/core/Rendering/edgesRenderer";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { Process } from "@/common/process";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Observable, Subject } from "rxjs";
import { Animation } from "@babylonjs/core/Animations/animation";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { PowerEase } from "@babylonjs/core/Animations/easing";

export class AppEngine extends Process {
  public engine: Engine;
  public paused = false;
  private currentScene?: SceneBase;
  private nextScene?: SceneBase;
  private renderFuncs: Array<{ [key: string]: () => void }> = [];
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
      Object.keys(this.renderFuncs).forEach((key: string) =>
        (this.renderFuncs as any)[key]()
      );
    });
    engine.resize();
    this.addClear(
      fromEvent(window, "resize").subscribe(() => {
        engine.resize();
      })
    );
    this.engine = engine;
    this.addClear(() => engine.dispose());
  }
  start<T extends SceneBase = SceneBase, M = any>(Scene: T, meta: M) {
    this.child("render").clear();
    const scene = Scene.initialize(this, meta);
    if (this.currentScene) this.nextScene = scene;
    else this.currentScene = scene;
    this.child("render").addClear(() => {
      this.currentScene?.destory();
    });
    return this.currentScene as T;
  }
  pause() {
    this.paused = true;
  }
  sceneUpdate() {
    if (this.nextScene) {
      this.currentScene = this.nextScene;
      this.nextScene = undefined;
      this.event$.next({
        event: "scene",
        data: this.currentScene,
      });
    }
    this.currentScene?.update();
  }
  event$ = new Subject();
}

export class SceneBase<M = any> {
  engine!: AppEngine;
  sceneObj!: Scene;
  constructor(name: string, public session = new Process(name)) {}
  meta!: M;
  initialize(engine: AppEngine, meta: any = {}) {
    this.meta = meta;
    this.engine = engine;
    const scene = new Scene(engine.engine);
    scene.useRightHandedSystem = true;
    const am = new ActionManager(scene);
    scene.actionManager = am;
    am.registerAction(
      new ExecuteCodeAction(
        {
          trigger: ActionManager.OnPickTrigger,
        },
        (ev) => {
          console.log(ev);
        }
      )
    );
    this.sceneObj = scene;
    this.session.addClear(() => {
      this.destory();
    });
    const eseaAll = new PowerEase(2);
    // eseaAll.setEasingMode(CircleEase.EASINGMODE_EASEIN);
    this.cntAni.setEasingFunction(eseaAll);
    return this;
  }
  update() {
    this.sceneObj.render();
  }
  destory() {
    this.sceneObj.dispose();
    const i = this.engine.engine.scenes.indexOf(this.sceneObj);
    i > -1 && this.engine.engine.scenes.splice(i, 1);
    this.session.clear();
  }
  private camAni = new Animation(
    "moveto",
    "position",
    20,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CONSTANT,
    true
  );
  private cntAni = new Animation(
    "offset",
    "target",
    20,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CONSTANT,
    true
  );
  public canInteractive = true;
  moveCamera(camName = "main", target: Vector3, center?: Vector3) {
    const cam = this.sceneObj.getCameraByName(camName) as ArcRotateCamera;
    return new Observable<{ kind: "end" | "loop"; [key: string]: any }>(
      (suber) => {
        const oldPos = cam.position.clone();
        const dist1 = oldPos.subtract(target).length();
        const frame = Math.round((dist1 / 100) * 20);
        const ckeys = [
          {
            frame: 0,
            value: oldPos.clone(),
          },
          {
            frame,
            value: target.clone(),
          },
        ];
        this.camAni.setKeys(ckeys);
        const anis = [this.camAni];
        const oldCnt = (cam as any).target?.clone();
        if (center && oldCnt) {
          const okeys = [
            {
              frame: 0,
              value: oldCnt.clone(),
            },
            {
              frame,
              value: center.clone(),
            },
          ];
          this.cntAni.setKeys(okeys);
          anis.push(this.cntAni);
        }
        this.canInteractive = false;
        this.setCamControl(false);
        const ani = this.sceneObj.beginDirectAnimation(
          cam,
          anis,
          0,
          frame,
          false
        );
        const ob1 = ani.onAnimationLoopObservable.add((ev, state) => {
          suber.next({ kind: "loop", ev, state });
        });
        const ob2 = ani.onAnimationEndObservable.add((ev, state) => {
          suber.next({ kind: "end", ev, state });
          this.canInteractive = true;
          this.setCamControl(true);
        });
        return () => {
          ani.onAnimationLoopObservable.remove(ob1);
          ani.onAnimationEndObservable.remove(ob2);
        };
      }
    );
  }
  setCamControl(v = false) {
    this.sceneObj.cameras.forEach((el) => {
      if (!v) el.detachControl();
      else el.attachControl();
    });
  }
}
