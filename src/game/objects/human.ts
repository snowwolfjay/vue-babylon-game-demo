import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Scene } from '@babylonjs/core/scene';
import { Observable, Subscriber } from 'rxjs';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ActionManager } from '@babylonjs/core/Actions/actionManager';
import { InterpolateValueAction } from '@babylonjs/core/Actions/interpolateValueAction';
import { ExecuteCodeAction } from '@babylonjs/core/Actions/directActions';
import { ActionEvent } from '@babylonjs/core/Actions/actionEvent';
import { CreateCapsule } from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
export class Human extends ObjectBase implements MovebalItem {
  private body: Mesh;
  constructor(
    name: string,
    scene: Scene,
    public readonly height = 3,
    public readonly round = 1
  ) {
    super(name, scene, height);
    const mat = new StandardMaterial(`human`, scene);
    mat.diffuseColor = new Color3(1, 0, 1);
    mat.specularColor = new Color3(0.5, 0.6, 0.87);
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.ambientColor = new Color3(0.23, 0.98, 0.53);
    const humanSim = CreateCapsule(name, { height, radius: round });
    humanSim.material = mat;
    humanSim.position.addInPlace(new Vector3(0, height / 2, 0));
    // humanSim.setPivotPoint();new Vector3(0, -height / 2, 0)
    humanSim.actionManager = new ActionManager(scene);
    humanSim.actionManager
      .registerAction(
        new ExecuteCodeAction(
          { trigger: ActionManager.OnPointerOverTrigger },
          (ev) => {
            console.log(ev);
          }
        )
      )
      .then(
        new ExecuteCodeAction(
          { trigger: ActionManager.OnPointerOutTrigger },
          (ev) => {
            console.warn(ev);
          }
        )
      );
    this.addPart(humanSim);
    this.body = humanSim;
  }
  getObject(): Mesh {
    return this.body;
  }
  getSize() {
    return [this.round * 2, this.round * 2, this.height] as any;
  }
}
