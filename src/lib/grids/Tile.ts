import TM from '../tm';
import { Geometry, MeshPhongMaterial, Mesh, Vector3, Euler } from 'three';
import Cell from './Cell';
import { TileSettings } from '../utils/Interfaces';

// Visual representation of a cell
export default class Tile {

  public cell: Cell;
  
  public geometry: Geometry;
  public material: MeshPhongMaterial;
  public mesh: Mesh;

  public selected: boolean;
  public highlight: number;
  
  public userData: {
    terrain?: string;
    elevation?: number;
    moisture?: number;
  };
  public entity: any;
  
  public position: Vector3;
  public rotation: Euler;

  public uniqueID: string;
  public objectType: string;

  private _emissive: number;

  
  constructor(config?: TileSettings) {
    config = config || {} as TileSettings;
    let settings: TileSettings = {
      cell: null,
      geometry: null,
      material: null,
    };
    settings = TM.Tools.merge(settings, config) as TileSettings;

    if (!settings.cell || !settings.geometry) {
      throw new Error('Missing TM.Tile configuration');
    }

    this.cell = settings.cell;
    if (this.cell.tile && this.cell.tile !== this) this.cell.tile.dispose(); // remove whatever was there
    this.cell.tile = this;

    this.uniqueID = TM.Tools.generateID();

    this.geometry = settings.geometry;
    this.material = settings.material;
    if (!this.material) {
      this.material = new MeshPhongMaterial({
        color: TM.Tools.randomizeRGB('0, 105, 148', 13)
      });
    }

    this.objectType = TM.TILE;
    this.entity = null;
    this.userData = {};

    this.selected = false;
    this.highlight = 0x0084cc;

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.userData.structure = this;

    // create references so we can control orientation through this (Tile), instead of drilling down
    this.position = this.mesh.position;
    this.rotation = this.mesh.rotation;

    // rotate it to face "up" (the threejs coordinate space is Y+)
    this.rotation.x = -90 * TM.DEG_TO_RAD;
    this.mesh.scale.set(settings.scale, settings.scale, 1);

    if (this.material.emissive) {
      this._emissive = this.material.emissive.getHex();
    }
    else {
      this._emissive = null;
    }
  }
  select(): Tile {
    if (this.material.emissive) {
      this.material.emissive.setHex(this.highlight);
    }
    this.selected = true;
    console.log(this.userData.terrain)
    console.log(this.userData.elevation);
    console.log(this.position);
    return this;
  }

  deselect(): Tile {
    if (this._emissive !== null && this.material.emissive) {
      this.material.emissive.setHex(this._emissive);
    }
    this.selected = false;
    return this;
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
    this.position = null;
    this.rotation = null;
    if (this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.userData.structure = null;
    this.mesh = null;
    this.material = null;
    this.userData = null;
    this.entity = null;
    this.geometry = null;
    this._emissive = null;
  }
  
  setTerrain(e: number, m: number): void {
    
    this.userData.elevation = e;
    this.userData.moisture = m;

    if (e < 0.02) {
      this.userData.terrain = 'OCEAN';
      return;
    }
    if (e < 0.06) {
      this.userData.terrain = 'BEACH';
      this.material.color.set(TM.Tools.randomizeRGB('194,178,128', 13));
      return;
    }
    if (e < .3) {
      this.userData.terrain = 'PLAIN';
      this.material.color.set(TM.Tools.randomizeRGB('70,118,58', 13));
      return;
    }
    if (e < 1) {
      this.userData.terrain = 'MOUNTAIN';
      
      this.material.color.set(TM.Tools.randomizeRGB('107,110,112', 13));
      return;
    };

    /*if (e > 0.6) {
      if (m < 0.1) {
        this.userData.terrain = 'SCORCHED';
        this.material.color.set(TM.Tools.randomizeRGB('171,95,58', 13));
        return;
      }
      if (m < 0.2) {
        this.userData.terrain = 'BARE';
        this.material.color.set(TM.Tools.randomizeRGB('215,171,114', 13));
        return;
      }
      if (m < 0.5) {
        this.userData.terrain = 'TUNDRA';
        this.material.color.set(TM.Tools.randomizeRGB('152,171,180', 13));
        return;
      }
      this.userData.terrain = 'SNOW';
      this.material.color.set(TM.Tools.randomizeRGB('223,217,221', 13));
      return;
    }

    /*if (e > 0.45) {
      if (m < 0.33) {
        this.userData.terrain = 'TEMPERATE_DESERT';
        this.material.color.set(TM.Tools.randomizeRGB('200,184,158', 13));
        return;
      }
      if (m < 0.66) {
        this.userData.terrain = 'SHRUBLAND';
        this.material.color.set(TM.Tools.randomizeRGB('125,124,62', 13));
        return;
      };
      this.userData.terrain = 'TAIGA';
      this.material.color.set(TM.Tools.randomizeRGB('16,86,76', 13));
      return;
    }

    if (e > 0.35) {
      if (m < 0.16) {
        this.userData.terrain = 'TEMPERATE_DESERT';
        this.material.color.set(TM.Tools.randomizeRGB('200,184,158', 13));
        return;
      }
      if (m < 0.25) {
        this.userData.terrain = 'GRASSLAND';
        this.material.color.set(TM.Tools.randomizeRGB('147,217,69', 13));
        return;
      }
      //if (m < 0.83) return 'TEMPERATE_DECIDUOUS_FOREST';
      this.userData.terrain = 'FOREST';
      this.material.color.set(TM.Tools.randomizeRGB('16,59,35', 13));
      return;
    }

    if (m < 0.16) {
      this.userData.terrain = 'SUBTROPICAL_DESERT';
      this.material.color.set(TM.Tools.randomizeRGB('152,79,15', 13));
      return;
    }
    if (m < 0.33) {
      this.userData.terrain = 'GRASSLAND';
      this.material.color.set(TM.Tools.randomizeRGB('147,217,69', 13));
      return;
    }
    this.userData.terrain = 'TROPICAL_RAIN_FOREST';
    this.material.color.set(TM.Tools.randomizeRGB('79,159,27', 13));
    return;*/
  }
}