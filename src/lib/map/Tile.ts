import Engine, { EngineGridShapes, EngineTileShapes } from '../Engine';
import { Geometry, MeshPhongMaterial, Mesh, Vector3, Euler, Material, BufferGeometry, BufferAttribute, ShapeBufferGeometry, Box3, ObjectLoader, Quaternion, Matrix4, Shape, ExtrudeGeometryOptions, ExtrudeBufferGeometry } from 'three';
import Cell, { CellNeighborDirections } from '../grid/Cell';
import { TileJSONData, TileSettings, TileSettingsParams, heuristic } from '../utils/Interfaces';
import Grid from '../grid/Grid';
import Entity, { EntityPlacementType } from '../env/Entity';
import MeshText from '../env/MeshText';
import HexTile from './HexTile';
import SqrTile from './SqrTile';

export enum TileTerrain {
  NONE = "NONE",
  Ocean = "Ocean",
  Beach = "Beach",
  Plain = "Plain",
  Hill = "Hill",
  Desert = "Desert",
  Forest = "Forest",
  Mountain = "Mountain",
}

// Visual representation of a cell
export default abstract class Tile {

  public cell: Cell;
  public tileShape: EngineTileShapes;
  public geometry: BufferGeometry;
  public material: Material;
  public mesh: Mesh;

  public selected: boolean;
  public highlighted: boolean;
  public highlightColor: number;
  public selectColor: number;

  private _textMesh: MeshText;

  public get textMesh() {
    return this._textMesh;
  }

  public entities: Entity[] = new Array<Entity>();

  private readonly _yAxis = new Vector3(0, 1, 0);
  private readonly _yRot = -90 * Engine.DEG_TO_RAD;
  public get position(): Vector3 {
    if (this._grid && this._grid.gridShape === Engine.GridShapes.FLAT_TOP_HEX) {
      return this.mesh.position.clone().applyAxisAngle(this._yAxis, this._yRot);
    }
    return this.mesh.position;
  }

  protected static _geoCache: Map<TileTerrain, BufferGeometry>
  protected static _matCache: { [id: string]: Material };

  protected abstract get geoCache(): Map<TileTerrain, BufferGeometry>

  protected abstract get matCache(): { [id: string]: Material };

  protected static _baseTileShapePath: Shape;
  protected abstract get baseTileShapePath(): Shape;

  // protected static _baseTileGeo: BufferGeometry;
  // protected abstract get baseTileGeo(): BufferGeometry;

  // protected static _baseTileShapeGeo: ShapeBufferGeometry;
  // protected abstract get baseTileShapeGeo(): ShapeBufferGeometry;

  setPosition(pos: Vector3) {
    this.mesh.position.copy(pos);
  }

  public rotation: Euler;

  public uniqueID: string;
  public objectType: string;

  private _emissiveBaseColor: number;
  // private _vertexGeometry: ShapeBufferGeometry;
  private _grid: Grid;

  // private _vertMesh: Mesh;

  public customData: { [name: string]: any } = {};

  private _terrainInfo: { type: TileTerrain, elevation: number, moisture: number } = { type: TileTerrain.NONE, elevation: 0, moisture: 0 };
  public get terrainInfo(): { type: TileTerrain, elevation: number, moisture: number } {
    return this._terrainInfo;
  }

  private _settings: TileSettings;
  constructor(config?: TileSettingsParams) {
    let settings: TileSettings;
    if (config)
      settings = Engine.Tools.merge(settings, config) as TileSettings;

    if (!settings.cell) {
      throw new Error('Missing Engine.Tile configuration');
    }

    this._settings = settings;
    this._grid = settings.grid;
    this.tileShape = settings.tileShape;
    this.cell = settings.cell;

    if (this.cell.tile && this.cell.tile !== this) this.cell.tile.dispose(); // remove whatever was there
    this.cell.tile = this;

    this.uniqueID = Engine.Tools.generateID();

    // if (!Tile._tileGeo)
    //   this._createBaseTileShape();

    let terrainType: TileTerrain;
    let terrainInfo: { elevation: number, moisture: number };

    if (!config.terrainType) {
      terrainInfo = this._generateTileElevationAndMoisture();
      let height = Math.abs(terrainInfo.elevation);
      terrainInfo.elevation = height;

      // if (height < 1) height = 1;

      terrainType = Tile.terrainInfoToTerrainType(height, terrainInfo.moisture);
    } else {
      terrainInfo = Tile.terrainToInfo(config.terrainType);
      terrainType = config.terrainType;
    }

    this._terrainInfo = {
      type: terrainType,
      moisture: terrainInfo.moisture,
      elevation: terrainInfo.elevation
    };

    this.geometry = this._getTileGeo(this.terrainInfo.type);
    this.material = settings.material;


    if (!this.material) {
      this.material = new MeshPhongMaterial({
        color: Engine.Tools.randomizeRGB('0, 105, 148', 13),
      });
    }

    this.objectType = Engine.TILE;
    this.entities = [];

    this.selected = false;
    this.highlighted = false;
    this.highlightColor = 0x0084cc;
    this.selectColor = 0x0084cc;

    this.mesh = new Mesh(this.geometry, this.material);
    // this._vertMesh = new Mesh(this._vertexGeometry);

    this.mesh.userData.structure = this;

    // create references so we can control orientation through this (Tile), instead of drilling down
    this.rotation = this.mesh.rotation;

    // rotate it to face "up" (the threejs coordinate space is Y+)
    this.rotation.x = -90 * Engine.DEG_TO_RAD;

    this.mesh.scale.set(settings.scale, settings.scale, 1);

    if ((this.material as MeshPhongMaterial).emissive) {
      this._emissiveBaseColor = (this.material as MeshPhongMaterial).emissive.getHex();
    }
    else {
      this._emissiveBaseColor = null;
    }

    this.setTerrainType(this._terrainInfo.type, this._terrainInfo.elevation, this._terrainInfo.moisture);
  }

  protected abstract _createBaseTileShape();

  highlight(setColor: boolean): void {
    if (setColor && (this.material as MeshPhongMaterial).emissive) {
      (this.material as MeshPhongMaterial).emissive.setHex(this.highlightColor);
    }

    this.highlighted = true;
  }

  unhighlight(): void {
    if (this._emissiveBaseColor !== null && (this.material as MeshPhongMaterial).emissive) {
      (this.material as MeshPhongMaterial).emissive.setHex(this._emissiveBaseColor);
    }

    this.highlighted = false;
  }

  setHighlighted(highlighted: boolean): void {
    if (highlighted) this.highlight(true);
    else this.unhighlight();
  }

  toggleHighlight(): void {
    if (this.highlighted) this.unhighlight();
    else this.highlight(true);
  }

  select(): Tile {
    // if ((this.material as MeshPhongMaterial).emissive) {
    //   (this.material as MeshPhongMaterial).emissive.setHex(this.selectColor);
    // }

    this.selected = true;

    return this;
  }

  deselect(): Tile {
    // if (this._emissive !== null && (this.material as MeshPhongMaterial).emissive) {
    //   (this.material as MeshPhongMaterial).emissive.setHex(this._emissive);
    // }

    this.selected = false;
    return this;
  }

  setSelected(selected: boolean): Tile {
    if (selected) return this.select();
    else return this.deselect();
  }

  toggle(): Tile {
    if (this.selected) {
      this.deselect();
    }
    else {
      this.select();
    }
    return this;
  }

  dispose(): void {
    if (this.cell && this.cell.tile) this.cell.tile = null;
    this.cell = null;
    this.rotation = null;
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.userData.structure = null;
    this.mesh = null;
    this.material = null;
    this.entities = null;
    this.geometry = null;
    this._emissiveBaseColor = null;
  }

  public static terrainInfoToTerrainType(e: number, m: number): TileTerrain {
    // these thresholds will need tuning to match your generator

    // if (e < 0.05) return TileTerrain.Ocean;
    // if (e < 0.1) return TileTerrain.Beach;

    // if (e > 0.8) {
    //   if (m < 0.1) return TileTerrain.Scorched;
    //   if (m < 0.2) return TileTerrain.Bare;
    //   if (m < 0.5) return TileTerrain.Tundra;
    //   return TileTerrain.Snow
    // }

    // if (e > 0.6) {
    //   if (m < 0.33) return TileTerrain.Temperate_Desert;
    //   if (m < 0.66) return TileTerrain.Shrubland;
    //   return TileTerrain.Taiga;
    // }

    // if (e > 0.3) {
    //   if (m < 0.16) return TileTerrain.Temperate_Desert;
    //   if (m < 0.50) return TileTerrain.Plain;
    //   if (m < 0.83) return TileTerrain.Temperate_Deciduous_Forest;
    //   return TileTerrain.Temperate_Rain_Forest;
    // }

    // if (m < 0.16) return TileTerrain.Subtropical_Desert;
    // if (m < 0.33) return TileTerrain.Plain;
    // if (m < 0.66) return TileTerrain.Tropical_Seasonal_Forest;
    // return TileTerrain.NONE;

    if (e < 0.02) {
      return TileTerrain.Ocean;
    }
    // if (e < 0.05) {
    //   return TileTerrain.Beach
    // }
    if (e < .2) {
      if (m < .3) return TileTerrain.Desert
      else if (m < .6)
        return TileTerrain.Plain;
      else return TileTerrain.Forest
    }
    if (e < .3) {
      return TileTerrain.Hill
    }
    if (e < 1) {
      return TileTerrain.Mountain;
    }
  }

  public static terrainToInfo(terrain: TileTerrain): { elevation: number, moisture: number } {
    let elevation, moisture;
    switch (terrain) {
      case TileTerrain.Ocean:
        elevation = .01;
        moisture = 1;
        break;
      case TileTerrain.Beach:
        elevation = .05;
        moisture = .9;
        break;
      case TileTerrain.Plain:
      case TileTerrain.Forest:
        elevation = .2;
        moisture = .7;
        break;
      case TileTerrain.Desert:
        elevation = .2;
        moisture = .2;
        break;
      case TileTerrain.Hill:
        elevation = .3;
        moisture = .7;
      case TileTerrain.Mountain:
        elevation = .5;
        moisture = .5;
      default:
        elevation = 0;
        moisture = 0;
    }

    return { elevation, moisture };
  }


  private _terrainToExtrudeHeight(terrain: TileTerrain): number {
    switch (terrain) {
      case TileTerrain.Ocean:
        return .5;
      case TileTerrain.Beach:
        return .75;
      case TileTerrain.Mountain:
        return 1.5;
      default:
        return 1;
    }
  }


  private _getTileGeo(terrainType: TileTerrain) {
    let geo = this.geoCache.get(terrainType);

    if (!geo) {
      let opts: ExtrudeGeometryOptions = {
        steps: 1,
        depth: this._terrainToExtrudeHeight(terrainType),
        bevelEnabled: true,
        bevelThickness: .5,
        bevelSize: 1,
        bevelSegments: 2
      }


      geo = new ExtrudeBufferGeometry(this.baseTileShapePath, opts);
      this.geoCache.set(terrainType, geo);
      geo.computeBoundingBox();
    }

    return geo;
  }

  public setTerrainType(terrainType: TileTerrain, elevation?: number, moisture?: number): void {
    if (terrainType === this.terrainInfo.type && !elevation && !moisture) return;

    this.setMaterialFromTerrain(terrainType);

    // this.mesh.geometry.dispose();
    let geo = this._getTileGeo(terrainType);

    this.cell.grid.map.updateTile(this, new Mesh(geo, this.material));;
    this.geometry = geo;
    this.rotation.x = -90 * Engine.DEG_TO_RAD;

    this.mesh.userData.structure = this;

    this.mesh.position.copy(this.cell.grid.cellToPixel(this.cell));
    this.mesh.position.y = 0;

    // create references so we can control orientation through this (Tile), instead of drilling down
    // this._position = this.mesh.position;
    this.rotation = this.mesh.rotation;

    // rotate it to face "up" (the threejs coordinate space is Y+)
    this.rotation.x = -90 * Engine.DEG_TO_RAD;
    this.mesh.scale.set(this._settings.scale, this._settings.scale, 1);
    // this._terrainType = terrainType;

    let info = Tile.terrainToInfo(terrainType);
    this._terrainInfo = { type: terrainType, elevation: elevation || info.elevation, moisture: moisture || info.moisture };
  }


  setTerrain(e: number, m: number): void {
    let terrain = Tile.terrainInfoToTerrainType(e, m);

    this._terrainInfo = { type: terrain, elevation: e, moisture: m };

    this.setMaterialFromTerrain(terrain);

    /*if (e > 0.6) {
      if (m < 0.1) {
        this.userData.terrain = 'SCORCHED';
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('171,95,58', 13));
        return;
      }
      if (m < 0.2) {
        this.userData.terrain = 'BARE';
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('215,171,114', 13));
        return;
      }
      if (m < 0.5) {
        this.userData.terrain = 'TUNDRA';
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('152,171,180', 13));
        return;
      }
      this.userData.terrain = 'SNOW';
      (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('223,217,221', 13));
      return;
    }

    /*if (e > 0.45) {
      if (m < 0.33) {
        this.userData.terrain = 'TEMPERATE_DESERT';
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('200,184,158', 13));
        return;
      }
      if (m < 0.66) {
        this.userData.terrain = 'SHRUBLAND';
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('125,124,62', 13));
        return;
      };
      this.userData.terrain = 'TAIGA';
      (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('16,86,76', 13));
      return;
    }

    if (e > 0.35) {
      if (m < 0.16) {
        this.userData.terrain = 'TEMPERATE_DESERT';
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('200,184,158', 13));
        return;
      }
      if (m < 0.25) {
        this.userData.terrain = 'GRASSLAND';
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('147,217,69', 13));
        return;
      }
      //if (m < 0.83) return 'TEMPERATE_DECIDUOUS_FOREST';
      this.userData.terrain = 'FOREST';
      (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('16,59,35', 13));
      return;
    }

    if (m < 0.16) {
      this.userData.terrain = 'SUBTROPICAL_DESERT';
      (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('152,79,15', 13));
      return;
    }
    if (m < 0.33) {
      this.userData.terrain = 'GRASSLAND';
      (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('147,217,69', 13));
      return;
    }
    this.userData.terrain = 'TROPICAL_RAIN_FOREST';
    (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('79,159,27', 13));
    return;*/
  }

  private setMaterialFromTerrain(terrainType: TileTerrain) {
    switch (terrainType) {
      case TileTerrain.Ocean:
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('0, 105, 148', 13));
        break;
      case TileTerrain.Beach:
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('194,178,128', 13));
        break;
      case TileTerrain.Plain:
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('205,176,59', 13));
        break;
      case TileTerrain.Hill:
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('110,162,67', 13));
        break;
      case TileTerrain.Desert:
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('190,111,52', 13));
        break;
      case TileTerrain.Forest:
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('42,70,26', 13));
        break;
      case TileTerrain.Mountain:
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('107,110,112', 13));
        break;
      default:
        (this.material as MeshPhongMaterial).color.set(Engine.Tools.randomizeRGB('255,255,255', 13));
    }
  }

  private _vertexPos = new Vector3(0, 0, 0);
  private _centerPos = new Vector3(0, 0, 0);
  public getVertexWorldPosition(index) {
    const angle = (Engine.TAU / 6) * index;
    this._centerPos.set(0, 0, 0);

    this._centerPos.add(this._vertexPos.set(((this.cell.radius) * Math.cos(angle)), ((this.cell.radius) * Math.sin(angle)), 0));

    this._centerPos.divide(this.mesh.scale)

    return this.mesh.localToWorld(this._centerPos).clone();
  }

  private _edgePos: Vector3 = new Vector3();
  public getEdgeWorldPosition(index) {
    let startVertex = index;
    let endVertex = index === 5 ? 0 : index + 1;

    let startPos = this.getVertexWorldPosition(startVertex);
    let endPos = this.getVertexWorldPosition(endVertex);

    return this._edgePos.set(((startPos.x + endPos.x) / 2), ((startPos.y + endPos.y) / 2), ((startPos.z + endPos.z) / 2)).clone();
  }

  public getVertexNeighbors(index: number): Array<{ tile: Tile, vertex: number }> {
    let neighs = new Array<{ tile: Tile, vertex: number }>();

    let nw, ne, sw, se, w, e, n, s;
    if (this._grid.gridShape === EngineGridShapes.FLAT_TOP_HEX) {
      switch (index) {
        case 0:
          nw = this.getNeighbor(CellNeighborDirections.NORTH_WEST);
          if (nw) neighs.push({ tile: nw.tile, vertex: 4 });
          ne = this.getNeighbor(CellNeighborDirections.NORTH_EAST);
          if (ne) neighs.push({ tile: ne.tile, vertex: 2 });
          break;
        case 1:
          nw = this.getNeighbor(CellNeighborDirections.NORTH_WEST);
          if (nw) neighs.push({ tile: nw.tile, vertex: 3 });
          w = this.getNeighbor(CellNeighborDirections.WEST);
          if (w) neighs.push({ tile: w.tile, vertex: 5 });
          break;
        case 2:
          sw = this.getNeighbor(CellNeighborDirections.SOUTH_WEST);
          if (sw) neighs.push({ tile: sw.tile, vertex: 0 });
          w = this.getNeighbor(CellNeighborDirections.WEST);
          if (w) neighs.push({ tile: w.tile, vertex: 4 });
          break;
        case 3:
          sw = this.getNeighbor(CellNeighborDirections.SOUTH_WEST);
          if (sw) neighs.push({ tile: sw.tile, vertex: 5 });
          se = this.getNeighbor(CellNeighborDirections.SOUTH_EAST);
          if (se) neighs.push({ tile: se.tile, vertex: 1 });
          break;
        case 4:
          se = this.getNeighbor(CellNeighborDirections.SOUTH_EAST);
          if (se) neighs.push({ tile: se.tile, vertex: 0 });
          e = this.getNeighbor(CellNeighborDirections.EAST);
          if (e) neighs.push({ tile: e.tile, vertex: 2 });
          break;
        case 5:
          ne = this.getNeighbor(CellNeighborDirections.NORTH_EAST);
          if (ne) neighs.push({ tile: ne.tile, vertex: 3 });
          e = this.getNeighbor(CellNeighborDirections.EAST);
          if (e) neighs.push({ tile: e.tile, vertex: 1 });
          break;
      }
    }

    return neighs;
  }

  public getEdgeNeighbors(index: number): Array<{ tile: Tile, edge: number }> {
    let neighs = new Array<{ tile: Tile, edge: number }>();

    let nw, ne, sw, se, w, e, n, s;
    if (this._grid.gridShape === EngineGridShapes.FLAT_TOP_HEX) {
      switch (index) {
        case 0:
          nw = this.getNeighbor(CellNeighborDirections.NORTH_WEST);
          if (nw) neighs.push({ tile: nw.tile, edge: 3 });
          break;
        case 1:
          w = this.getNeighbor(CellNeighborDirections.WEST);
          if (w) neighs.push({ tile: w.tile, edge: 4 });
          break;
        case 2:
          sw = this.getNeighbor(CellNeighborDirections.SOUTH_WEST);
          if (sw) neighs.push({ tile: sw.tile, edge: 5 });
          break;
        case 3:
          se = this.getNeighbor(CellNeighborDirections.SOUTH_EAST);
          if (se) neighs.push({ tile: se.tile, edge: 0 });
          break;
        case 4:
          e = this.getNeighbor(CellNeighborDirections.EAST);
          if (e) neighs.push({ tile: e.tile, edge: 1 });
          break;
        case 5:
          ne = this.getNeighbor(CellNeighborDirections.NORTH_EAST);
          if (ne) neighs.push({ tile: ne.tile, edge: 2 });
          break;
      }
    }

    return neighs;
  }

  public getVertexWorldPositions() {
    const vertexAmount = this.tileShape === Engine.TileShapes.HEX ? 6 : 4;
    let vertices = {};
    for (let i = 0; i < vertexAmount; i++) {
      vertices[i] = this.getVertexWorldPosition(i);
    }

    return vertices;
  }

  getNeighbors(diagonals?: boolean, filter?: heuristic): Cell[] {
    return this._grid.getNeighbors(this.cell, diagonals, filter);
  }


  getNeighbor(neighborDir: CellNeighborDirections): Cell | null {
    return this._grid.getNeighbor(this.cell, neighborDir);
  }

  public getTileScreenPosition(): { x: number, y: number } {
    var vector = new Vector3();

    var widthHalf = 0.5 * this._grid.map.view.renderer.context.canvas.width;
    var heightHalf = 0.5 * this._grid.map.view.renderer.context.canvas.height;

    this.mesh.updateMatrixWorld();
    vector.setFromMatrixPosition(this.mesh.matrixWorld);
    vector.project(this._grid.map.view.camera);

    vector.x = (vector.x * widthHalf) + widthHalf;
    vector.y = - (vector.y * heightHalf) + heightHalf;

    return {
      x: vector.x,
      y: vector.y
    };
  }

  public removeTextMesh() {
    if (this.textMesh) {
      this.mesh.remove(this.textMesh.group);
      this._textMesh = null;
    }
  }

  public addTextMesh(text: MeshText) {
    this.removeTextMesh();

    this.mesh.add(text.group);

    if (this._grid && this._grid.gridShape == EngineGridShapes.FLAT_TOP_HEX) {
      text.group.rotation.x = 180 * Engine.DEG_TO_RAD;
      text.group.rotation.y = 180 * Engine.DEG_TO_RAD;
      text.group.rotation.z = 90 * Engine.DEG_TO_RAD;
    } else if (this._grid && this._grid.gridShape == EngineGridShapes.POINT_TOP_HEX) {
      text.group.rotation.x = -90 * Engine.DEG_TO_RAD;
      text.group.rotation.z = 180 * Engine.DEG_TO_RAD;
    }
    // group.rotation.z = 180 * Engine.DEG_TO_RAD;
    text.group.position.set(0, 0, this.geometry.boundingBox.max.z);

    this._textMesh = text;
  }

  toJSON(): TileJSONData {
    let data = {
      terrainInfo: this.terrainInfo,
      customData: this.customData
    } as TileJSONData

    if (this.entities.length > 0) {
      data.entities = this.entities.map(entity => entity.toJSON())
    }

    if (this.textMesh)
      data.text = this.textMesh.toJSON();

    return data;
  }

  private static objectLoader: ObjectLoader;

  fromJSON(data: TileJSONData) {
    this.setTerrainType(data.terrainInfo.type, data.terrainInfo.elevation, data.terrainInfo.moisture);

    if (data.customData) this.customData = data.customData;

    if (data.text) {
      new MeshText(data.text.text, (obj) => {
        this.addTextMesh(obj);
        obj.group.scale.set(data.text.groupScale[0], data.text.groupScale[1], data.text.groupScale[2]);
      }, data.text.settings)
    }

    if (data.entities) {
      if (!Tile.objectLoader) Tile.objectLoader = new ObjectLoader();

      data.entities.forEach(e => {
        // Tile.objectLoader.parse(e.obj, (obj) => {
        //   let mesh = obj as Mesh;
        // });
        if (e.entityName in this.cell.grid.map.entities) {
          let entity = this.cell.grid.map.entities[e.entityName]();
          entity.fromJSON(e);
          this.cell.grid.map.setEntityOnTile(entity, this);
        }
      })
    }
  }

  private _placementTargetQuat = new Quaternion();
  private _placementRotMat = new Matrix4();

  public addEntity(entity: Entity, pos?: Vector3): boolean {
    if (this.entities.indexOf(entity) !== -1 || this.sharedEdgeEntities.find(e => e.entity === entity) || this.sharedVertEntities.find(e => e.entity === entity)) return false;

    this.entities.push(entity);
    let localPos;

    if (!pos) {
      let curPos = entity.position.clone();

      localPos = this.mesh.worldToLocal(curPos);
    } else localPos = pos;

    this.mesh.add(entity);
    entity.position.copy(localPos);

    let min1 = entity.placementEdge;
    let min2 = entity.placementType === EntityPlacementType.EDGE ? min1 === 5 ? 0 : min1 + 1 : min1;

    const start = this.mesh.worldToLocal(this.getVertexWorldPosition(min1));
    const end = this.mesh.worldToLocal(this.getVertexWorldPosition(min2));

    this._placementRotMat.lookAt(end, start, entity.up);
    this._placementTargetQuat.setFromRotationMatrix(this._placementRotMat);
    entity.quaternion.set(this._placementTargetQuat.x, this._placementTargetQuat.y, this._placementTargetQuat.z, this._placementTargetQuat.w);

    if (entity.placementType === EntityPlacementType.VERTEX)
      this.addVertEntityToNeighbors(entity);
    else if (entity.placementType === EntityPlacementType.EDGE) {
      this.addEdgeEntityToNeighbors(entity);
    }

    entity.ignoreRay = false;
    return true;
  }

  private _sharedVertEntities: { entity: Entity, owner: Tile, vertex: number, ownerVertex: number }[] = [] as { entity: Entity, owner: Tile, vertex: number, ownerVertex: number }[];
  public get sharedVertEntities(): { entity: Entity, owner: Tile, vertex: number, ownerVertex: number }[] {
    return this._sharedVertEntities;
  }

  private _sharedEdgeEntities: { entity: Entity, owner: Tile, edge: number, ownerEdge: number }[] = [] as { entity: Entity, owner: Tile, edge: number, ownerEdge: number }[];
  public get sharedEdgeEntities(): { entity: Entity, owner: Tile, edge: number, ownerEdge: number }[] {
    return this._sharedEdgeEntities;
  }

  private addVertEntityToNeighbors(entity: Entity) {
    let neighs = this.getVertexNeighbors(entity.placementVertex);

    for (const neigh of neighs) {
      neigh.tile._sharedVertEntities.push({ entity: entity, owner: this, vertex: neigh.vertex, ownerVertex: entity.placementVertex })
    }
  }

  private addEdgeEntityToNeighbors(entity: Entity) {
    let neighs = this.getEdgeNeighbors(entity.placementEdge);

    for (const neigh of neighs) {
      neigh.tile._sharedEdgeEntities.push({ entity: entity, owner: this, edge: neigh.edge, ownerEdge: entity.placementEdge })
    }
  }

  public removeEntity(entity: Entity): boolean {

    if (entity.placementType === EntityPlacementType.EDGE) this.removeEdgeEntityFromNeighbors(entity);
    else if (entity.placementType === EntityPlacementType.VERTEX) this.removeVertEntityFromNeighbors(entity);

    if (this.entities.indexOf(entity) !== -1) {
      this.entities.splice(this.entities.indexOf(entity), 1);
      this.mesh.remove(entity);
      entity.dispose();

      console.log('removed');
      return true;
    }

    console.log('could not remove')

    return false;
  }

  private removeVertEntityFromNeighbors(entity: Entity) {
    let neighs = this.getVertexNeighbors(entity.placementEdge);

    for (const neigh of neighs) {
      const obj = neigh.tile._sharedVertEntities.find(x => x.entity = entity);

      if (obj) {
        const index = neigh.tile._sharedVertEntities.indexOf(obj);

        if (index !== -1) neigh.tile._sharedVertEntities.splice(index, 1);
      }
    }
  }

  private removeEdgeEntityFromNeighbors(entity: Entity) {
    let neighs = this.getEdgeNeighbors(entity.placementEdge);

    for (const neigh of neighs) {
      const obj = neigh.tile._sharedEdgeEntities.find(x => x.entity = entity);
      if (obj) {
        const index = neigh.tile._sharedEdgeEntities.indexOf(obj);

        if (index !== -1) neigh.tile._sharedEdgeEntities.splice(index, 1);
      }
    }
  }

  public static dispose() {
    Tile._geoCache = null;
    Tile._matCache = null;
    Tile._baseTileShapePath = null;
    this._geoCache = null;
    this._matCache = null;
    this._baseTileShapePath = null;
  }

  protected _generateTileElevationAndMoisture(): { elevation: number; moisture: number } {
    const nx = this.cell.q / this.cell.width - 0.5, ny = this.cell.r / this.cell.length - 0.5;

    let e = (1.00 * Engine.Tools.noise1(1 * nx, 1 * ny)
      + 0.50 * Engine.Tools.noise1(2 * nx, 2 * ny)
      + 0.25 * Engine.Tools.noise1(4 * nx, 4 * ny)
      + 0.13 * Engine.Tools.noise1(8 * nx, 8 * ny)
      + 0.06 * Engine.Tools.noise1(16 * nx, 16 * ny)
      + 0.03 * Engine.Tools.noise1(32 * nx, 32 * ny));
    e /= (1.00 + 0.50 + 0.25 + 0.13 + 0.06 + 0.03);
    e = Math.pow(e, 5.00);
    let m = (1.00 * Engine.Tools.noise2(1 * nx, 1 * ny)
      + 0.75 * Engine.Tools.noise2(2 * nx, 2 * ny)
      + 0.33 * Engine.Tools.noise2(4 * nx, 4 * ny)
      + 0.33 * Engine.Tools.noise2(8 * nx, 8 * ny)
      + 0.33 * Engine.Tools.noise2(16 * nx, 16 * ny)
      + 0.50 * Engine.Tools.noise2(32 * nx, 32 * ny));
    m /= (1.00 + 0.75 + 0.33 + 0.33 + 0.33 + 0.50);

    return { elevation: e, moisture: m };
  }
}