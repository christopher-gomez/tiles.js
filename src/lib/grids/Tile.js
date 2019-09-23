import TM from '../tm';
import * as THREE from 'three';

// Visual representation of a cell
export default class Tile {
  
  constructor(config) {
    config = config || {};
    var settings = {
      cell: null, // required TM.Cell
      geometry: null, // required threejs geometry (hex or square?)
      material: null // not required but it would improve performance significantly
    };
    settings = TM.Tools.merge(settings, config);

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
      this.material = new THREE.MeshPhongMaterial({
        color: TM.Tools.randomizeRGB('0, 105, 148', 13)
      });
    }

    this.objectType = TM.TILE;
    this.entity = null;
    this.userData = {};

    this.selected = false;
    this.highlight = '0x0084cc';

    this.mesh = new THREE.Mesh(this.geometry, this.material);
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
  select() {
    if (this.material.emissive) {
      this.material.emissive.setHex(this.highlight);
    }
    this.selected = true;
    console.log(this.userData.terrain)
    console.log(this.userData.elevation);
    console.log(this.position);
    return this;
  }

  deselect() {
    if (this._emissive !== null && this.material.emissive) {
      this.material.emissive.setHex(this._emissive);
    }
    this.selected = false;
    return this;
  }

  toggle() {
    if (this.selected) {
      this.deselect();
    }
    else {
      this.select();
    }
    return this;
  }

  dispose() {
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
  
  setTerrain(e, m) {
    
    this.userData.elevation = e;
    this.userData.moisture = m;

    if (e < 0.1) {
      this.userData.terrain = 'OCEAN';
      return;
    }
    if (e < 0.12) {
      this.userData.terrain = 'BEACH';
      this.material.color.set(TM.Tools.randomizeRGB('212,192,155', 13));
      return;
    }

    if (e > 0.8) {
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

    if (e > 0.6) {
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

    if (e > 0.3) {
      if (m < 0.16) {
        this.userData.terrain = 'TEMPERATE_DESERT';
        this.material.color.set(TM.Tools.randomizeRGB('200,184,158', 13));
        return;
      }
      if (m < 0.50) {
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
    return;
  }
}