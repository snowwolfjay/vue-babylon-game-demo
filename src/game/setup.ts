import "@babylonjs/core/Helpers/sceneHelpers";

import { Observable, Subject } from "rxjs";
import { AppEngine } from "./engine";
import { SceneDemo } from "./SceneDemo";

const BUILDING_LEVEL_HEIGHT = 6;
export class SceneManager {
  public static current: SceneManager;
  public static animating = false;
  constructor() {
    if (SceneManager.current) return SceneManager.current;
  }
  initScene(canvas: HTMLCanvasElement) {
    return new Observable((suber) => {
      const core = new AppEngine(canvas);
      const lv = BUILDING_LEVEL_HEIGHT;
      core.start(new SceneDemo(), {
        buildings: [
          {
            size: [40, 15, 22, lv],
            pos: [-80, 0, 0],
            id: "b1",
          },
          {
            id: "b2",
            size: [40, 15, 12, lv],
            pos: [-38, 0, 0],
          },
          {
            id: "b3",
            size: [40, 15, 12, lv],
            pos: [38, 0, 0],
          },
          {
            id: "b4",
            size: [40, 15, 22, lv],
            pos: [80, 0, 0],
          },
          {
            id: "ud",
            size: [200, 80, 3, lv],
            pos: [0, 0, 0],
            under: true,
          },
        ],
        persons: [
          { id: "baoan1",name:"小王", bid: "b1", pos: [] },
          { id: "baoan111",name:"小科", bid: "b1", pos: [1, -20] },
          { id: "baoan11",name:"小竹", bid: "b1", pos: [13, -2] },
          { id: "baoan2",name:"小张", bid: "b2", pos: [2, 1, 11] },
          { id: "baoan3",name:"小给", bid: "b3", pos: [2, 3, 2] },
          { id: "baoan4",name:"小李", bid: "b4", pos: [12, 111, 11] },
          { id: "baoan5",name:"小站", bid: "ud", pos: [-2, -11, -11] },
        ],
      });
      const ea = core.event$.subscribe((v) => suber.next(v));
      suber.next({
        pause() {
          core.pause();
        },
      });
      return () => {
        core.clear();
        ea.unsubscribe();
      };
    });
  }
}
