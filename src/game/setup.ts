
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Material } from '@babylonjs/core/Materials/material';
import '@babylonjs/core/Helpers/sceneHelpers';

import { Observable } from 'rxjs';
import { AppEngine, SceneDemo } from './engine';
import { Building, Human } from './objects';
const BUILDING_LEVEL_HEIGHT = 6;

export class SceneService {
  constructor() {}
  public engine: Engine;
  initScene(canvas: HTMLCanvasElement) {
    return new Observable((suber) => {
      const core = new AppEngine(canvas);
      const scene = core.start(new SceneDemo());
      const baseMat = new StandardMaterial('matpbr', scene);
      baseMat.alpha = 0.8;
      baseMat.alphaMode = Material.MATERIAL_ALPHABLEND;
      const camera = new ArcRotateCamera(
        'camera',
        -Math.PI / 3,
        Math.PI / 2.5,
        3,
        new Vector3(0, 0, 0),
        scene
      );
      camera.attachControl(canvas, true);
      camera.setPosition(new Vector3(40, 20, 60));

      var light = new HemisphericLight('dir', new Vector3(40, 40, 40), scene);

      var ground = CreateGround('ground1', { width: 32, height: 12 }, scene);
      ground.material = baseMat.clone('ground');
      const lv = BUILDING_LEVEL_HEIGHT;
      const buildings = [
        {
          size: [40, 15, 22, lv],
          pos: [-80, 0, 0],
          id: 'b1',
        },
        {
          id: 'b2',
          size: [40, 15, 12, lv],
          pos: [-38, 0, 0],
        },
        {
          id: 'b3',
          size: [40, 15, 12, lv],
          pos: [38, 0, 0],
        },
        {
          id: 'b4',
          size: [40, 15, 22, lv],
          pos: [80, 0, 0],
        },
        {
          id: 'ud',
          size: [200, 80, 3, lv],
          pos: [0, 0, 0],
          under: true,
        },
      ];
      const buildMap: { [key: string]: Building } = {};
      buildings.forEach((el) => {
        const b = new Building(scene, el.id, el.size as any, !!el.under, {});
        b.moveTo(...el.pos);
        b.wallClicked$().subscribe((v) => {
          console.warn(v);
        });
        buildMap[el.id] = b;
      });
      const baoanList = [
        { id: 'baoan1', bid: 'b1', pos: [] },
        { id: 'baoan11', bid: 'b1', pos: [1, -20] },
        { id: 'baoan11', bid: 'b1', pos: [13, -2] },
        { id: 'baoan2', bid: 'b2', pos: [2, 1, 11] },
        { id: 'baoan3', bid: 'b3', pos: [2, 3, 2] },
        { id: 'baoan4', bid: 'b4', pos: [12, 111, 11] },
        { id: 'baoan5', bid: 'ud', pos: [-2, -11, -11] },
      ];
      baoanList.forEach((el) => {
        const baoan = new Human(el.id, scene, 3, 1);
        const building = buildMap[el.bid];
        const [floor = 1, x = 0, y = 0] = el.pos;
        building.addToFloor(floor, baoan, x, y);
      });
      scene.addMesh(ground);

      suber.next({
        pause() {
          core.pause();
        },
      });
      return () => {
        core.clear();
      };
    });
  }
}
