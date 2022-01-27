import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Observable, Subscriber } from "rxjs";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Material } from "@babylonjs/core/Materials/material";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import { ActionEvent } from "@babylonjs/core/Actions/actionEvent";
import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";
import { Process } from "@/common/process";
import { SceneBase } from "./engine";
export class Building extends ObjectBase {
  public wall!: Mesh;
  public floors: Mesh[] = [];
  level: number;
  depth: number;
  width: number;
  levelHeight: number;
  wallActionManager?: ActionManager;
  get height() {
    return this.levelHeight * this.level;
  }
  get sceneObj() {
    return this.scene.sceneObj;
  }
  constructor(
    public readonly scene: SceneBase,
    public readonly name: string,
    public readonly size: [number, number, number, number], // w,h,d
    public readonly isUnderground = false,
    data: any
  ) {
    super(name, scene, size[2] * size[3], data);
    Object.assign(this.metadata, {
      type: "building",
      building: "" as any as Building,
    });
    this.width = size[0];
    this.depth = size[1];
    this.level = size[2];
    this.levelHeight = size[3];
    if (isUnderground) {
      this.position.addInPlace(new Vector3(0, -this.height));
    }
    this.buildWall();
    this.buildFloors();
    this.metadata.building = this;
  }
  buildWall() {
    const sceneObj = this.sceneObj;
    const box = CreateBox(this.name + "-wall", {
      width: this.width,
      height: this.height,
      depth: this.depth,
    });
    const baseMat = new StandardMaterial("matpbr", sceneObj);
    baseMat.alpha = 0.8;
    baseMat.alphaMode = Material.MATERIAL_ALPHABLEND;
    box.material = baseMat;
    box.enableEdgesRendering();
    // box.enablePointerMoveEvents = false;
    box.edgesWidth = 1.5;
    box.edgesColor = new Color4(0, 0, 1, 1);
    // const Base = new Vector3(x, y + GROUP_DOWN, z);
    // box.position.addInPlace(Base);
    box.locallyTranslate(new Vector3(0, this.height / 2, 0));
    // box.visibility = 0.2;
    this.wall = box;
    box.metadata = this.metadata;
    this.addPart(box);
  }
  buildFloors() {
    const sceneObj = this.sceneObj;
    // const startHoz = this.isUnderground ? -this.height : 0;
    for (let i = 0; i < this.level; i++) {
      const fname = this.name + "-floor-" + i;
      const floor = CreateGround(
        fname,
        {
          width: this.width,
          height: this.depth,
        },
        sceneObj
      );
      floor.parent = this.wall;
      floor.position.addInPlace(
        new Vector3(0, -this.height / 2 + i * this.levelHeight)
      );
      this.floors[i + 1] = floor;
      floor.material = new StandardMaterial("matpbr", sceneObj);
      floor.material.alpha = 0.3;
      floor.metadata = this.metadata;
    }
  }
  addToFloor(lv: number, node: MovebalItem, x = 0, y = 0, isAbs = false) {
    const floor = this.getFloor(lv);
    const [_l, w, _h] = node.getSize();
    x = makeBetween(x, -this.width / 2 + w / 2, this.width / 2 - w / 2);
    y = makeBetween(y, -this.depth / 2 + w / 2, this.depth / 2 - w / 2);
    node.position.addInPlace(new Vector3(x, 0, y));
    node.parent = floor;
  }
  getFloor(level: number) {
    if (!this.isUnderground) return this.floors[level];
    const i = this.level + 1 + level;
    return this.floors[i];
  }
  setData() {
    return this;
  }
  hideWall(keepFloor: any) {
    this.wallActionManager = this.wall.actionManager as any;
    this.wall.actionManager = null;
    this.wall.visibility = 0;
  }
  showWall() {
    this.wall.actionManager = this.wallActionManager!;
    this.wall.visibility = 1;
  }
  static currentSuber: Subscriber<any>;
  wallClicked$() {
    return new Observable<ActionEvent>((suber) => {
      const box = this.wall;
      box.actionManager = new ActionManager(this.sceneObj);
      let downTime = 0;
      box.actionManager.registerAction(
        new ExecuteCodeAction(
          { trigger: ActionManager.OnPickDownTrigger },
          (ev) => {
            downTime = Date.now();
          }
        )
      );
      box.actionManager.registerAction(
        new ExecuteCodeAction(
          { trigger: ActionManager.OnPickUpTrigger },
          (ev) => {
            if (Date.now() - downTime < 200) {
              suber.next(ev);
            } else {
              console.warn(`long press`);
            }
          }
        )
      );
      const cancel = this.session.addClear(() => {
        suber.complete();
        box.actionManager = null;
      });
      return cancel;
    });
  }
  focus() {
    this.session.child("focus").clear();
    return new Observable((suber) => {
      this.hideWall(true);
      const camPos = this.position.add(
        new Vector3(
          0,
          Math.max(this.width, this.height) * 1.5,
          Math.max(this.width, this.height) * 1.2
        )
      );
      this.session.child("focus").addClear(
        this.scene
          .moveCamera("main", camPos, new Vector3(this.position.x, 0, 0))
          .subscribe((v) => {
            console.log(v);
          })
      );
      suber.next({
        cancel: () => suber.complete(),
      });
      return () => {
        this.showWall();
        this.session.child("focus").clear();
      };
    });
  }
}
