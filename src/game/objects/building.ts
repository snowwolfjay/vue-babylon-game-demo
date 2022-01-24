
export class Building extends ObjectBase {
  private wall: Mesh;
  private floors: Mesh[] = [];
  public readonly metadata = {
    type: 'building',
    building: '' as any as Building,
  };
  level: number;
  depth: number;
  width: number;
  levelHeight: number;
  get height() {
    return this.levelHeight * this.level;
  }
  constructor(
    public readonly scene: Scene,
    public readonly name: string,
    public readonly size: [number, number, number, number], // w,h,d
    public readonly isUnderground = false,
    public data: any
  ) {
    super(name, scene, size[2] * size[3]);
    this.width = size[0];
    this.depth = size[1];
    this.level = size[2];
    this.levelHeight = size[3];
    if (isUnderground) {
      this.position.addInPlace(new Vector3(0, -this.height));
    }
    this.buildWall(scene);
    this.buildFloors(scene);
    this.metadata.building = this;
    console.log(this);
  }
  buildWall(scene: Scene) {
    const box = CreateBox(this.name + '-wall', {
      width: this.width,
      height: this.height,
      depth: this.depth,
    });
    const baseMat = new StandardMaterial('matpbr', scene);
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
    box.visibility = 0.2;
    this.wall = box;
    box.metadata = this.metadata;
    this.addPart(box);
  }
  buildFloors(scene: Scene) {
    const startHoz = this.isUnderground ? -this.height : 0;
    for (let i = 0; i < this.level; i++) {
      const fname = this.name + '-floor-' + i;
      const floor = CreateGround(
        fname,
        {
          width: this.width,
          height: this.depth,
        },
        scene
      );
      floor.parent = this.wall;
      floor.position.addInPlace(
        new Vector3(0, -this.height / 2 + i * this.levelHeight)
      );
      this.floors[i + 1] = floor;
      floor.material = new StandardMaterial('matpbr', scene);
      floor.material.alpha = 0.3;
      floor.metadata = this.metadata;
    }
  }
  addToFloor(lv: number, node: MovebalItem, x = 0, y = 0, isAbs = false) {
    const floor = this.getFloor(lv);
    const [l, w, h] = node.getSize();
    x = makeBetween(x, -this.width / 2 + w / 2, this.width / 2 - w / 2);
    y = makeBetween(y, -this.depth / 2 + w / 2, this.depth / 2 - w / 2);
    console.log({ x, y });
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
    this.wall.visibility = 0;
  }
  showWall() {
    this.wall.visibility = 1;
  }
  static currentSuber: Subscriber<any>;
  wallClicked$() {
    return new Observable<ActionEvent>((suber) => {
      const box = this.wall;
      box.actionManager = new ActionManager(this.scene);
      box.actionManager.registerAction(
        new ExecuteCodeAction(
          { trigger: ActionManager.OnPickDownTrigger },
          (ev) => {
            suber.next(ev);
          }
        )
      );
      const cancel = this.tracker.addClear(() => suber.complete());
      return cancel;
    });
  }
}
