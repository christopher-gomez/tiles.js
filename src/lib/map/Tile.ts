import Engine, { EngineGridShapes, EngineTileShapes } from "../Engine";
import {
  Geometry,
  MeshPhongMaterial,
  Mesh,
  Vector3,
  Euler,
  Material,
  BufferGeometry,
  BufferAttribute,
  ShapeBufferGeometry,
  Box3,
  ObjectLoader,
  Quaternion,
  Matrix4,
  Shape,
  ExtrudeGeometryOptions,
  ExtrudeBufferGeometry,
  PointLight,
  Line,
  LineBasicMaterial,
  Color,
  ShaderMaterial,
  DoubleSide,
  Vector2,
  Points,
  AdditiveBlending,
  TextureLoader,
  BoxBufferGeometry,
} from "three";
import Cell, { CellNeighborDirections } from "../grid/Cell";
import { TileJSONData, TileType, heuristic } from "../utils/Interfaces";
import Grid from "../grid/Grid";
import MeshEntity, { EntityPlacementType } from "../env/MeshEntity";
import MeshText from "../env/MeshText";
import HexTile from "./HexTile";
import SqrTile from "./SqrTile";
import Animation from "../utils/Animation";
import Tools from "../utils/Tools";
import { BufferGeometryUtils } from "three/examples/jsm/utils/BufferGeometryUtils";
import ringTexture from "../../Assets/Textures/light-circle-frame-43d9c99e4a381fe99ff1f8a15729646b.png";

// export enum TileTerrain {
//   NONE = "NONE",
//   Ocean = "Ocean",
//   Beach = "Beach",
//   Plain = "Plain",
//   Hill = "Hill",
//   Desert = "Desert",
//   Forest = "Forest",
//   Mountain = "Mountain",
// }

// Visual representation of a cell
export default abstract class Tile {
  public cell: Cell;
  public tileShape: EngineTileShapes;
  public geometry: ExtrudeBufferGeometry;

  public get material(): MeshPhongMaterial {
    return this.phongMat;
  }

  public set material(val: MeshPhongMaterial) {
    if (this.phongMat && this._material.indexOf(this.phongMat) !== -1)
      this._material.splice(this._material.indexOf(this.phongMat), 1);

    this.phongMat = val;
    this._material.push(this.phongMat);

    if (this.mesh) this.mesh.material = this._material;
  }

  private _material: Array<Material>;
  private _mesh: Mesh;
  public mesh: Mesh;

  public selected: boolean;
  public highlighted: boolean;
  public highlightColor: number;
  public selectColor: number;

  private _textMesh: MeshText[] = new Array<MeshText>(0);

  public get textMesh() {
    return this._textMesh;
  }

  public entities: MeshEntity[] = new Array<MeshEntity>();

  private readonly _yAxis = new Vector3(0, 1, 0);
  private readonly _yRot = -90 * Engine.DEG_TO_RAD;
  public get mapPosition(): Vector3 {
    if (this._grid && this._grid.gridShape === Engine.GridShapes.FLAT_TOP_HEX) {
      return this.mesh.position.clone().applyAxisAngle(this._yAxis, this._yRot);
    }

    return this.mesh.position;
  }

  protected static _geoCache: Map<TileType, ExtrudeBufferGeometry>;
  protected static _matCache: { [id: string]: Material };

  protected abstract get geoCache(): Map<TileType, ExtrudeBufferGeometry>;

  protected abstract get matCache(): { [id: string]: Material };

  protected static _baseTileShapePath: Shape;
  public abstract get baseTileShapePath(): Shape;

  setPosition(pos: Vector3) {
    this.mesh.position.copy(pos);
  }

  public rotation: Euler;

  public uniqueID: string;
  public objectType: string;

  private _phongBaseColor: number;
  // private _vertexGeometry: ShapeBufferGeometry;
  private _grid: Grid;

  // private _vertMesh: Mesh;

  private _customData: { [name: string]: any } = {};
  public getCustomData() {
    return this._customData;
  }

  public setCustomDataVal(key: string, value: any) {
    this._customData[key] = value;
  }

  public setCustomData(data: { [name: string]: any }) {
    this._customData = data;
  }

  // private _terrainInfo: { type: TileTerrain, elevation: number, moisture: number } = { type: TileTerrain.NONE, elevation: 0, moisture: 0 };
  // public get terrainInfo(): { type: TileTerrain, elevation: number, moisture: number } {
  //   return this._terrainInfo;
  // }

  // private _settings: TileSettings;
  private _type: TileType;
  public get type(): TileType {
    return this._type;
  }

  private static _tileTypes: { [name: string]: TileType } = {};
  public static get tileTypes(): { [name: string]: TileType } {
    return this._tileTypes;
  }

  protected static instanceOfTileType(object: any): object is TileType {
    return "geomOpts" in object; // TODO: make this check better
  }

  protected static instanceOfTileJSONData(object: any): object is TileJSONData {
    return "type" in object;
  }

  constructor(cell?: Cell, data?: TileType | TileJSONData) {
    // this._settings = settings;

    if (cell) {
      this._grid = cell.grid;
      this.tileShape = cell.shape;
    }

    if (cell) this.cell = cell;

    // if (cell?.tile && cell.tile !== this) {
    //   console.log('Cell used for New Tile already had a Cell associated with it: ' + this.cell.tile.mesh.uuid);
    //   cell.tile.dispose(); // remove whatever was there
    // }

    if (this.cell) this.cell.tile = this;

    this.uniqueID = Engine.Tools.generateID();
    this.selected = false;
    this.highlighted = false;
    this.highlightColor = 0x0084cc;
    this.selectColor = 0x0084cc;

    this.objectType = Engine.TILE;
    this.entities = [];

    let settings: TileType =
      data !== undefined && Tile.instanceOfTileJSONData(data)
        ? data.type
        : {
            name: "Default",
            color: Engine.Tools.randomizeRGB("0, 0, 0", 50),
            scale: 1,
            geomOpts: {
              steps: 1,
              depth: 0.1,
              bevelEnabled: true,
              bevelThickness: 0.1,
              bevelSize: 0.5,
              bevelSegments: 2,
            } as ExtrudeGeometryOptions,
          };

    if (data !== undefined && Tile.instanceOfTileType(data))
      settings = Engine.Tools.merge(settings, data) as TileType;

    if (!(settings.name in Tile.tileTypes)) {
      Tile.tileTypes[settings.name] = settings;
    }

    this._type = settings;

    if (this.type.customData) {
      this._customData = { ...this.type.customData };
    }

    if (!data || Tile.instanceOfTileType(data))
      this.setTileMeshFromType(settings);
    else this.fromJSON(data);
  }

  private phongMat: MeshPhongMaterial;

  private static ringT = new TextureLoader().load(ringTexture);

  private createVertHighlightMaterial() {
    // Modify your vertex shader
    const vertexShader = `
    attribute float cornerVertex;
    attribute vec3 color; // Attribute to specify the color for each point
    varying vec3 vColor;
    varying vec2 vUv; // Pass texture coordinates to the fragment shader

    void main() {
        vColor = color; // Use the color specified for each point
        vUv = uv; // Pass texture coordinates
        if (cornerVertex == 0.0) {
            gl_Position = vec4(0.0); // Make non-highlighted points invisible
        } else {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }

        gl_PointSize = 25.0; // Increase the point size for a softer effect
    }
`;

    // Modify your fragment shader to sample the texture
    const fragmentShader = `
    varying vec3 vColor;
    varying vec2 vUv; // Receive texture coordinates from the vertex shader
    uniform sampler2D uTexture; // Custom texture for the point shape

    void main() {
        // Sample the custom texture using texture coordinates
        vec4 texColor = texture2D(uTexture, gl_PointCoord); // Sample the custom texture

        // Create a glowing effect by using a translucent color with emissive light
        vec3 emissiveColor = vColor; // Use the color for emissive light
        emissiveColor *= 50.0; // Increase the intensity of the emissive light

        // Apply transparency for a softer look
        vec4 transparentColor = vec4(vColor, 0.5); // Adjust the alpha value for transparency

        // Combine the texture color with the glowing effect
        gl_FragColor = vec4((transparentColor.rgb + emissiveColor) * texColor.rgb, texColor.a);
    }
`;

    // Create a ShaderMaterial with the custom shaders
    const customMaterial = new ShaderMaterial({
      uniforms: {
        uTexture: { value: Tile.ringT },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: DoubleSide,
      transparent: true, // Enable transparency
      blending: AdditiveBlending, // Additive blending for the glowing effect
      depthTest: false,
      fog: false,
    });

    return customMaterial;
  }

  private createEdgeHighlightMat() {
    // Create a ShaderMaterial with initial transparent/invisible state
    // Create a ShaderMaterial with initial transparent/invisible state
    const glowMaterial = new ShaderMaterial({
      uniforms: {
        glowColor: { value: new Color(0x00ff00) }, // Initial glow color
      },
      vertexShader: `
      varying vec3 vNormal;
      attribute float visibleFlag; // Custom attribute
  
      void main() {
        vNormal = normalize(normalMatrix * normal);
  
        // Check the visibility flag and adjust the position accordingly
        if (visibleFlag > 0.0) {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        } else {
          gl_Position = vec4(0.0); // Set position to (0, 0, 0) for invisible vertices
        }
      }
    `,
      fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 glowColor;
  
      void main() {
        // Create a glowing effect by using a translucent color with emissive light
        vec3 emissiveColor = glowColor; // Use the color for emissive light
        emissiveColor *= 50.0; // Increase the intensity of the emissive light

        // Apply transparency for a softer look
        vec4 transparentColor = vec4(glowColor, 0.5); // Adjust the alpha value for transparency

        // Combine the texture color with the glowing effect
        gl_FragColor = vec4(transparentColor.rgb, 0.5);
  
      }
    `,
      transparent: true,
      opacity: 0.5, // Start transparent/invisible
      side: DoubleSide,
      blending: AdditiveBlending, // Additive blending for the glowing effect
      depthTest: false,
      fog: false,
    });

    return glowMaterial;
  }

  private edgeHighlight: Array<Mesh<BoxBufferGeometry, ShaderMaterial>>;
  private createEdgeHighlightMesh() {
    if (!this._grid) return;

    this.edgeHighlight = [];
    for (
      let i = 0;
      i < (this._grid.cellShape === EngineTileShapes.HEX ? 6 : 4);
      i++
    ) {
      const geometry = new BoxBufferGeometry(1, 20, 1);
      geometry.rotateX(-90 * Engine.DEG_TO_RAD);
      geometry.rotateZ(180 * Engine.DEG_TO_RAD);
      // Create an array of visibility flags, initially set to 1.0 (visible)
      const visibilityFlags = new Float32Array(
        geometry.attributes.position.count
      ).fill(0.0);

      // Set the visibility flags as a custom attribute
      geometry.setAttribute(
        "visibleFlag",
        new BufferAttribute(visibilityFlags, 1)
      );
      const cubeMesh = new Mesh(geometry, this.createEdgeHighlightMat());
      cubeMesh.up.set(0, 1, 0);
      this.mesh.add(cubeMesh);
      this.setMeshOnEdge(cubeMesh, i);
      this.edgeHighlight.push(cubeMesh);
      cubeMesh.userData["raycast"] = false;
    }
  }

  private vertHighlightPoints: Points;
  private createVertHighlightMesh() {
    const points = HexTile.baseTileShapePath.getPoints();
    const geo = new BufferGeometry().setFromPoints(points);

    // Define an attribute to specify which vertices are to be highlighted (1.0 for highlighted, 0.0 for invisible)
    const cornerVertices = new Float32Array(points.length).fill(0.0);
    geo.setAttribute("cornerVertex", new BufferAttribute(cornerVertices, 1));

    const pointColors = new Float32Array(18).fill(0.0);
    geo.setAttribute("color", new BufferAttribute(pointColors, 3));

    const line = new Points(geo, this.createVertHighlightMaterial());
    this.mesh.add(line);
    this.vertHighlightPoints = line;
    line.position.setZ(this.geometry.boundingBox.max.z + 0.1);
  }

  public setTileMeshFromType(type: TileType) {
    this._type = Engine.Tools.merge(this._type, type) as TileType;

    Tile.tileTypes[this._type.name] = this._type;

    if (this.geometry) this.geometry.dispose();
    if (this._material) this._material.forEach((m) => m.dispose());

    this.geometry = this._getTileGeo(type);

    this.phongMat = new MeshPhongMaterial({
      color: type.color,
      reflectivity: 1,
    });
    const mats: Array<Material> = [this.phongMat];

    this._material = mats;

    let mesh = new Mesh(this.geometry, this.phongMat);

    // this._vertMesh = new Mesh(this._vertexGeometry);

    mesh.userData.structure = this;

    // create references so we can control orientation through this (Tile), instead of drilling down
    this.rotation = mesh.rotation;

    // rotate it to face "up" (the threejs coordinate space is Y+)
    this.rotation.x = -90 * Engine.DEG_TO_RAD;

    mesh.scale.set(type.scale, type.scale, 1);

    if (this.mesh) {
      let pos = this.mesh.position.clone();
      this.cell?.grid.map.updateTile(this, mesh);
      this.mesh.position.copy(pos);
    } else {
      this.mesh = mesh;
    }

    this.createVertHighlightMesh();
    this.createEdgeHighlightMesh();

    if ((this.phongMat as MeshPhongMaterial).color) {
      this._phongBaseColor = (
        this.phongMat as MeshPhongMaterial
      ).color.getHex();
    } else {
      this._phongBaseColor = null;
    }

    if (this.textMesh.length > 0) {
      const texts = [...this.textMesh];
      this.removeAllTextMesh();
      texts.forEach((t) => this.addTextMesh(t));
    }

    if (type.customData) {
      this._customData = {
        ...this._customData,
        ...type.customData,
      };
    }

    this.addBorder();

    if (this._grid && this.cell)
      this.mesh.name = this._grid.cellToHash(this.cell);
  }

  protected static _setBaseTileShape(shape: Shape) {
    this._baseTileShapePath = shape;
  }

  highlight(
    setColor: boolean,
    durationMs: number = 0,
    onStart?: () => void,
    onComplete?: () => void
  ): void {
    if (setColor && this.phongMat.color) {
      if (durationMs > 0 && this.cell?.grid?.map?.view.animationManager) {
        this.cell?.grid?.map?.view.animationManager.addAnimation(
          new Animation(
            durationMs,
            (dt) => {
              let curPhongHex = Tools.lerpHex(
                (this.phongMat as MeshPhongMaterial).color.getHex(),
                this.highlightColor,
                dt
              );
              (this.phongMat as MeshPhongMaterial).color.setHex(curPhongHex);

              if (this.textMesh && this.textMesh.length > 0) {
                this.textMesh.forEach((t) => {
                  let curTextHex = Tools.lerpHex(
                    (
                      (
                        t.textMesh1.material as Material[]
                      )[0] as MeshPhongMaterial
                    ).color.getHex(),
                    this.highlightColor,
                    dt
                  );

                  (
                    (t.textMesh1.material as Material[])[0] as MeshPhongMaterial
                  ).color.setHex(curTextHex);

                  curTextHex = Tools.lerpHex(
                    (
                      (
                        t.textMesh1.material as Material[]
                      )[1] as MeshPhongMaterial
                    ).color.getHex(),
                    this.highlightColor,
                    dt
                  );

                  (
                    (t.textMesh1.material as Material[])[1] as MeshPhongMaterial
                  ).color.setHex(curTextHex);
                });
              }
            },
            () => {
              if (onStart !== undefined) onStart();
            },
            () => {
              if (onComplete !== undefined) onComplete();
            }
          ),
          this.mesh.id + "-highlight",
          true
        );
      } else {
        (this.phongMat as MeshPhongMaterial).color.setHex(this.highlightColor);
        if (this.textMesh && this.textMesh.length > 0) {
          this.textMesh.forEach((t) => {
            (
              (t.textMesh1.material as Material[])[0] as MeshPhongMaterial
            ).color.setHex(this.highlightColor);
            (
              (t.textMesh1.material as Material[])[1] as MeshPhongMaterial
            ).color.setHex(this.highlightColor);
          });
        }
      }
    } else if (!setColor) {
      (this.phongMat as MeshPhongMaterial).color.setHex(this._phongBaseColor);
      if (this.textMesh && this.textMesh.length > 0) {
        this.textMesh.forEach((t) => {
          (
            (t.textMesh1.material as Material[])[0] as MeshPhongMaterial
          ).color.setHex(this.meshTextBaseColors[t.textMesh1.uuid + "-front"]);
          (
            (t.textMesh1.material as Material[])[1] as MeshPhongMaterial
          ).color.setHex(this.meshTextBaseColors[t.textMesh1.uuid + "-side"]);
        });
      }
    }

    this.highlighted = true;
  }

  unhighlight(durationMs: number = 0): void {
    if (
      this._phongBaseColor !== null &&
      (this.phongMat as MeshPhongMaterial).color
    ) {
      this.cell?.grid?.map.view.animationManager.stopAnimation(
        this.mesh.id + "-highlight"
      );
      if (durationMs > 0 && this.cell?.grid?.map?.view.animationManager) {
        this.cell?.grid?.map?.view.animationManager.addAnimation(
          new Animation(durationMs, (dt) => {
            let curHex = Tools.lerpHex(
              (this.phongMat as MeshPhongMaterial).color.getHex(),
              this._phongBaseColor,
              dt
            );
            (this.phongMat as MeshPhongMaterial).color.setHex(curHex);

            if (this.textMesh && this.textMesh.length > 0) {
              this.textMesh.forEach((t) => {
                let curTextHex = Tools.lerpHex(
                  (
                    (t.textMesh1.material as Material[])[0] as MeshPhongMaterial
                  ).color.getHex(),
                  this.meshTextBaseColors[t.textMesh1.uuid + "-front"],
                  dt
                );

                (
                  (t.textMesh1.material as Material[])[0] as MeshPhongMaterial
                ).color.setHex(curTextHex);

                curTextHex = Tools.lerpHex(
                  (
                    (t.textMesh1.material as Material[])[1] as MeshPhongMaterial
                  ).color.getHex(),
                  this.meshTextBaseColors[t.textMesh1.uuid + "-side"],
                  dt
                );
                (
                  (t.textMesh1.material as Material[])[1] as MeshPhongMaterial
                ).color.setHex(curTextHex);
              });
            }
          }),
          this.mesh.id + "-highlight",
          true
        );
      } else {
        (this.phongMat as MeshPhongMaterial).color.setHex(this._phongBaseColor);

        if (this.textMesh && this.textMesh.length > 0) {
          this.textMesh.forEach((t) => {
            (
              (t.textMesh1.material as Material[])[0] as MeshPhongMaterial
            ).color.setHex(
              this.meshTextBaseColors[t.textMesh1.uuid + "-front"]
            );
            (
              (t.textMesh1.material as Material[])[1] as MeshPhongMaterial
            ).color.setHex(this.meshTextBaseColors[t.textMesh1.uuid + "-side"]);
          });
        }
      }
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
    // if ((this.material as MeshPhongMaterial).color) {
    //   (this.material as MeshPhongMaterial).color.setHex(this.selectColor);
    // }

    this.selected = true;

    return this;
  }

  deselect(): Tile {
    // if (this._emissive !== null && (this.material as MeshPhongMaterial).color) {
    //   (this.material as MeshPhongMaterial).color.setHex(this._emissive);
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
    } else {
      this.select();
    }
    return this;
  }

  dispose(): void {
    if (this.cell && this.cell.tile) this.cell.tile = null;
    this.cell = null;
    this.rotation = null;
    if (this.mesh) {
      if (this.mesh?.parent) this.mesh?.parent.remove(this.mesh);
      this.mesh.userData.structure = null;
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this._material) {
      this._material.forEach((m) => m.dispose());
    }
    this._material = [];
    this.entities = null;
    this.geometry = null;
    this._phongBaseColor = null;
  }

  // public static terrainInfoToTerrainType(e: number, m: number): TileTerrain {
  //   // these thresholds will need tuning to match your generator

  //   // if (e < 0.05) return TileTerrain.Ocean;
  //   // if (e < 0.1) return TileTerrain.Beach;

  //   // if (e > 0.8) {
  //   //   if (m < 0.1) return TileTerrain.Scorched;
  //   //   if (m < 0.2) return TileTerrain.Bare;
  //   //   if (m < 0.5) return TileTerrain.Tundra;
  //   //   return TileTerrain.Snow
  //   // }

  //   // if (e > 0.6) {
  //   //   if (m < 0.33) return TileTerrain.Temperate_Desert;
  //   //   if (m < 0.66) return TileTerrain.Shrubland;
  //   //   return TileTerrain.Taiga;
  //   // }

  //   // if (e > 0.3) {
  //   //   if (m < 0.16) return TileTerrain.Temperate_Desert;
  //   //   if (m < 0.50) return TileTerrain.Plain;
  //   //   if (m < 0.83) return TileTerrain.Temperate_Deciduous_Forest;
  //   //   return TileTerrain.Temperate_Rain_Forest;
  //   // }

  //   // if (m < 0.16) return TileTerrain.Subtropical_Desert;
  //   // if (m < 0.33) return TileTerrain.Plain;
  //   // if (m < 0.66) return TileTerrain.Tropical_Seasonal_Forest;
  //   // return TileTerrain.NONE;

  //   if (e < 0.02) {
  //     return TileTerrain.Ocean;
  //   }
  //   // if (e < 0.05) {
  //   //   return TileTerrain.Beach
  //   // }
  //   if (e < .2) {
  //     if (m < .3) return TileTerrain.Desert
  //     else if (m < .6)
  //       return TileTerrain.Plain;
  //     else return TileTerrain.Forest
  //   }
  //   if (e < .3) {
  //     return TileTerrain.Hill
  //   }
  //   if (e < 1) {
  //     return TileTerrain.Mountain;
  //   }
  // }

  // public static terrainToInfo(terrain: TileTerrain): { elevation: number, moisture: number } {
  //   let elevation, moisture;
  //   switch (terrain) {
  //     case TileTerrain.Ocean:
  //       elevation = .01;
  //       moisture = 1;
  //       break;
  //     case TileTerrain.Beach:
  //       elevation = .05;
  //       moisture = .9;
  //       break;
  //     case TileTerrain.Plain:
  //     case TileTerrain.Forest:
  //       elevation = .2;
  //       moisture = .7;
  //       break;
  //     case TileTerrain.Desert:
  //       elevation = .2;
  //       moisture = .2;
  //       break;
  //     case TileTerrain.Hill:
  //       elevation = .3;
  //       moisture = .7;
  //     case TileTerrain.Mountain:
  //       elevation = .5;
  //       moisture = .5;
  //     default:
  //       elevation = 0;
  //       moisture = 0;
  //   }

  //   return { elevation, moisture };
  // }

  // private _terrainToExtrudeHeight(terrain: TileTerrain): number {
  //   switch (terrain) {
  //     // case TileTerrain.Ocean:
  //     //   return .5;
  //     // case TileTerrain.Beach:
  //     //   return .75;
  //     // case TileTerrain.Mountain:
  //     //   return 1.5;
  //     default:
  //       return .1;
  //   }
  // }

  private _getTileGeo(type: TileType) {
    let geo = this.geoCache.get(type);

    if (!geo) {
      geo = new ExtrudeBufferGeometry(this.baseTileShapePath, type.geomOpts);
      this.geoCache.set(type, geo);
      geo.computeBoundingBox();
    }

    return geo;
  }

  public overlayLines: { [edge: number]: Line } = {};

  private _vertexPos = new Vector3(0, 0, 0);
  private _centerPos = new Vector3(0, 0, 0);

  getVertexLocalPosition(index) {
    const angle = (Engine.TAU / 6) * index;
    this._centerPos.set(0, 0, 0);

    this._centerPos.add(
      this._vertexPos.set(
        this.cell.radius * Math.cos(angle),
        this.cell.radius * Math.sin(angle),
        0
      )
    );

    return this._centerPos.divide(this.mesh.scale).clone();
  }

  getVerticesLocalPositions() {
    if (this.tileShape !== Engine.TileShapes.SQUARE) {
      let pos = [];
      for (let i = 0; i < 6; i++) {
        pos.push(this.getVertexLocalPosition(i));
      }

      return pos;
    }
  }

  public highlightVertex(index, color: string | number = 0x0084cc) {
    const cornerVertices = (
      this.vertHighlightPoints.geometry as BufferGeometry
    ).getAttribute("cornerVertex") as BufferAttribute;
    const pointColors = (
      this.vertHighlightPoints.geometry as BufferGeometry
    ).getAttribute("color") as BufferAttribute;

    cornerVertices.setX(index, 1); // Update the 'cornerVertex' attribute

    const colorComponents = new Color(color);
    pointColors.setXYZ(
      index,
      colorComponents.r,
      colorComponents.g,
      colorComponents.b
    ); // Update the 'color' attribute

    // Mark the attributes as needing an update
    cornerVertices.needsUpdate = true;
    pointColors.needsUpdate = true;
  }

  public unHighlightVertex(index = -1) {
    const cornerVertices = (
      this.vertHighlightPoints.geometry as BufferGeometry
    ).getAttribute("cornerVertex") as BufferAttribute;

    if (index === -1) this.unhighlightAllVertices();
    else cornerVertices.setX(index, 0); // Update the 'cornerVertex' attribute

    // Mark the attributes as needing an update
    cornerVertices.needsUpdate = true;
  }

  highlightAllVertices(color: string | number = 0x0084cc) {
    for (
      let index = 0;
      index < (this.tileShape === Engine.TileShapes.HEX ? 6 : 4);
      index++
    ) {
      this.highlightVertex(index, color);
    }
  }

  unhighlightAllVertices() {
    for (
      let index = 0;
      index < (this.tileShape === Engine.TileShapes.HEX ? 6 : 4);
      index++
    ) {
      this.unHighlightVertex(index);
    }
  }

  // private edgeHighlightLine: Line;
  public highlightEdge(index: number, color: number | string = 0x0084cc) {
    let c = new Color(color);
    this.edgeHighlight[index].material.uniforms.glowColor.value.set(c.getHex()); // Red color
    const newVisibilityFlag =
      this.edgeHighlight[index].geometry.getAttribute("visibleFlag");
    for (
      let index = 0;
      index < (this.tileShape === Engine.TileShapes.HEX ? 6 : 4);
      index++
    ) {
      newVisibilityFlag.setX(index, 1); // Update the 'cornerVertex' attribute
    }

    // Update the visibility flag attribute
    newVisibilityFlag.needsUpdate = true;

    // Ensure the shader updates
    this.edgeHighlight[index].material.needsUpdate = true;
  }

  public unHighlightEdge(index = -1) {
    if (index === -1) {
      this.unhighlightAllEdges();
    } else {
      const newVisibilityFlag =
        this.edgeHighlight[index].geometry.getAttribute("visibleFlag");
      for (
        let index = 0;
        index < (this.tileShape === Engine.TileShapes.HEX ? 6 : 4);
        index++
      ) {
        newVisibilityFlag.setX(index, 0); // Update the 'cornerVertex' attribute
      }

      // Update the visibility flag attribute
      newVisibilityFlag.needsUpdate = true;
      // Ensure the shader updates
      this.edgeHighlight[index].material.needsUpdate = true;
    }
  }

  highlightAllEdges(color: string | number = 0x0084cc) {
    let promises = [];
    for (
      let index = 0;
      index < (this.tileShape === Engine.TileShapes.HEX ? 6 : 4);
      index++
    ) {
      promises.push(
        Tools.CreatePromiseRoutine(0, 0, () =>
          this.highlightEdge(index, color)
        )
      );
    }

    Promise.all(promises);
  }

  unhighlightAllEdges() {
    let promises = [];

    for (
      let index = 0;
      index < (this.tileShape === Engine.TileShapes.HEX ? 6 : 4);
      index++
    ) {
      promises.push(
        Tools.CreatePromiseRoutine(0, 0, () => this.unHighlightEdge(index))
      );
    }

    Promise.all(promises);
  }

  public getVertexWorldPosition(index) {
    return this.mesh.localToWorld(this.getVertexLocalPosition(index)).clone();
  }

  private _edgePos: Vector3 = new Vector3();
  getEdgeLocalPosition(startVert: number) {
    let startVertex = startVert;
    let endVertex = startVert === 5 ? 0 : startVert + 1;

    let startPos = this.getVertexLocalPosition(startVertex);
    let endPos = this.getVertexLocalPosition(endVertex);

    return this._edgePos
      .set(
        (startPos.x + endPos.x) / 2,
        (startPos.y + endPos.y) / 2,
        (startPos.z + endPos.z) / 2
      )
      .clone();
  }

  public getEdgeWorldPosition(startVert: number) {
    return this.mesh.localToWorld(this.getEdgeLocalPosition(startVert)).clone();
  }

  public getVertexNeighbors(
    index: number
  ): Array<{ tile: Tile; vertex: number }> {
    let neighs = new Array<{ tile: Tile; vertex: number }>();

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

  public getEdgeNeighbors(index: number): Array<{ tile: Tile; edge: number }> {
    let neighs = new Array<{ tile: Tile; edge: number }>();

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

  public getVertexAdjacentEdges(
    index: number
  ): Array<{ tile: Tile; edge: number }> {
    let edges = [] as { tile: Tile; edge: number }[];

    let forwardEdge = index;
    let backwardEdge = index === 0 ? 5 : forwardEdge - 1;

    edges.push(
      { tile: this, edge: forwardEdge },
      { tile: this, edge: backwardEdge }
    );

    let neighs = this.getVertexNeighbors(index);
    for (const neigh of neighs) {
      forwardEdge = neigh.vertex;
      backwardEdge = forwardEdge === 0 ? 5 : forwardEdge - 1;
      edges.push(
        { tile: neigh.tile, edge: forwardEdge },
        { tile: neigh.tile, edge: backwardEdge }
      );
    }

    return edges;
  }

  public getEdgeAdjacentVerteces(
    index: number
  ): Array<{ tile: Tile; vertex: number }> {
    let verts = [] as { tile: Tile; vertex: number }[];

    let forwardVert = index === 5 ? 0 : index + 1;
    let backwardVert = index;

    verts.push({ tile: this, vertex: forwardVert });
    verts.push({ tile: this, vertex: backwardVert });

    let neighs = this.getEdgeNeighbors(index);

    for (const neigh of neighs) {
      forwardVert = neigh.edge === 5 ? 0 : neigh.edge + 1;
      backwardVert = neigh.edge;
      verts.push({ tile: neigh.tile, vertex: forwardVert });
      verts.push({ tile: neigh.tile, vertex: backwardVert });
    }

    return verts;
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

  public getTileScreenPosition(): { x: number; y: number } {
    var vector = new Vector3();

    var widthHalf = 0.5 * this._grid.map.view.renderer.context.canvas.width;
    var heightHalf = 0.5 * this._grid.map.view.renderer.context.canvas.height;

    this.mesh.updateMatrixWorld();
    vector.setFromMatrixPosition(this.mesh.matrixWorld);
    vector.project(this._grid.map.view.camera);

    vector.x = vector.x * widthHalf + widthHalf;
    vector.y = -(vector.y * heightHalf) + heightHalf;

    return {
      x: vector.x,
      y: vector.y,
    };
  }

  public removeTextMesh(textMesh: MeshText) {
    this.mesh.remove(textMesh.group);

    const index = this._textMesh.findIndex(
      (t) => t.group.id === textMesh.group.id
    );
    if (index !== -1) {
      this._textMesh.splice(index, 1);
    }
  }

  public removeAllTextMesh() {
    this.loadingTextMeshes.forEach((t) => (t.cancelLoad = true));
    this.loadingTextMeshes = [];
    this._numTextMeshesToLoad = 0;
    this._numTextMeshesLoaded = 0;
    for (const mesh of this.textMesh) {
      this.removeTextMesh(mesh);
    }
  }

  private meshTextBaseColors: { [id: string]: number } = {};
  public addTextMesh(text: MeshText, removeCurrent: boolean = false) {
    if (removeCurrent) this.removeAllTextMesh();

    this.mesh.add(text.group);

    if (this._grid && this._grid.gridShape == EngineGridShapes.FLAT_TOP_HEX) {
      // text.group.rotation.x = 180 * Engine.DEG_TO_RAD;
      // text.group.rotation.y = 180 * Engine.DEG_TO_RAD;
      text.group.rotation.z = -90 * Engine.DEG_TO_RAD;
    } else if (
      this._grid &&
      this._grid.gridShape == EngineGridShapes.POINT_TOP_HEX
    ) {
      text.group.rotation.x = -90 * Engine.DEG_TO_RAD;
      text.group.rotation.z = 180 * Engine.DEG_TO_RAD;
    } else {
      text.group.rotation.x = 180 * Engine.DEG_TO_RAD;
      text.group.rotation.y = 180 * Engine.DEG_TO_RAD;
    }

    // group.rotation.z = 180 * Engine.DEG_TO_RAD;
    text.group.position.set(0, 0, this.geometry.boundingBox.max.z + 0.1);
    text.group.scale.copy(
      this.mesh.scale.clone().divideScalar(this.cell.radius)
    );

    this._textMesh.push(text);
    this.meshTextBaseColors[text.textMesh1.uuid + "-front"] = (
      (text.textMesh1.material as Material[])[0] as MeshPhongMaterial
    ).color.getHex();
    this.meshTextBaseColors[text.textMesh1.uuid + "-side"] = (
      (text.textMesh1.material as Material[])[1] as MeshPhongMaterial
    ).color.getHex();
  }

  toJSON(): TileJSONData {
    let data = {
      // terrainInfo: this.terrainInfo,
      type: this.type,
      customData: this.getCustomData(),
    } as TileJSONData;

    if (this.entities.length > 0) {
      data.entities = this.entities.map((entity) => entity.toJSON());
    }

    if (this.textMesh.length > 0)
      data.text = this.textMesh.map((t) => t.toJSON());

    return data;
  }

  private static objectLoader: ObjectLoader;

  private loadingTextMeshes: MeshText[] = [];
  private _numTextMeshesLoaded = 0;
  private _numTextMeshesToLoad = 0;

  private set numTextMeshesLoaded(val) {
    this._numTextMeshesLoaded = val;

    if (val === this._numTextMeshesToLoad) {
      if (this._onTextMeshesLoaded)
        this._onTextMeshesLoaded(this.loadingTextMeshes);
      this._onTextMeshesLoaded = null;
    }
  }

  private _onTextMeshesLoaded: (meshes: MeshText[]) => void;

  public set onTextMeshesLoaded(val: (meshes: MeshText[]) => void) {
    this._onTextMeshesLoaded = val;
    if (
      this._numTextMeshesToLoad !== 0 &&
      this._numTextMeshesToLoad === this._numTextMeshesLoaded
    ) {
      val(this.loadingTextMeshes);
      this._onTextMeshesLoaded = null;
    }
  }

  public setEntitiesFromJSON(data: TileJSONData) {
    if (data.entities) {
      this.removeAllEntities();

      data.entities.forEach((e) => {
        if (e.entityName in this.cell.grid.map.entities) {
          let entity = this.cell.grid.map.entities[e.entityName]();
          entity.fromJSON(e);
          this.cell.grid.map.setEntityOnTile(entity, this, false, false);
        }
      });
    }
  }

  fromJSON(data: TileJSONData) {
    // this.setTerrainType(data.terrainInfo.type, data.terrainInfo.elevation, data.terrainInfo.moisture);
    this._type = data.type;

    this.setTileMeshFromType(this._type);

    if (data.customData) this._customData = data.customData;

    if (data.text) {
      for (const t of this.textMesh) {
        this.removeTextMesh(t);
      }

      if (Array.isArray(data.text)) {
        this._numTextMeshesToLoad = data.text.length;
        data.text.forEach((t) => {
          this.loadingTextMeshes.push(
            MeshText.CreateText(
              t.text,
              (obj) => {
                this.addTextMesh(obj);
                this.numTextMeshesLoaded = this._numTextMeshesLoaded + 1;
              },
              t.settings
            )
          );
        });
      } else {
        this._numTextMeshesToLoad = 1;
        this.loadingTextMeshes.push(
          MeshText.CreateText(
            data.text.text,
            (obj) => {
              this.addTextMesh(obj);
              this.numTextMeshesLoaded = this._numTextMeshesLoaded + 1;
            },
            data.text.settings
          )
        );
      }
    }

    this.setEntitiesFromJSON(data);
  }

  private _placementTargetQuat = new Quaternion();
  private _placementRotMat = new Matrix4();

  private setMeshOnEdge(mesh: Mesh, edge: number) {
    mesh.position
      .copy(this.getEdgeLocalPosition(edge))
      .setZ(this.geometry.boundingBox.max.z + 0.1);
    let min1 = edge;
    let min2 = min1 === 5 ? 0 : min1 + 1;

    const start = this.mesh.worldToLocal(this.getVertexWorldPosition(min1));
    const end = this.mesh.worldToLocal(this.getVertexWorldPosition(min2));

    this._placementRotMat.lookAt(end, start, mesh.up);
    this._placementTargetQuat.setFromRotationMatrix(this._placementRotMat);
    mesh.quaternion.set(
      this._placementTargetQuat.x,
      this._placementTargetQuat.y,
      this._placementTargetQuat.z,
      this._placementTargetQuat.w
    );
  }

  public addEntity(entity: MeshEntity, pos?: Vector3): boolean {
    if (
      this.entities.findIndex((e) => e.id === entity.id) !== -1 ||
      this.sharedEdgeEntities.find((e) => e.entity.id === entity.id) ||
      this.sharedVertEntities.find((e) => e.entity.id === entity.id)
    )
      return false;

    this.entities.push(entity);
    let localPos;

    if (!pos) {
      let curPos = entity.position.clone();

      localPos = this.mesh.worldToLocal(curPos);
    } else localPos = pos;

    this.mesh.add(entity);
    entity.position.copy(localPos);

    if (entity.placementType !== EntityPlacementType.CENTER) {
      let min1 =
        entity.placementType === EntityPlacementType.EDGE
          ? entity.placementEdge
          : entity.placementVertex;
      let min2 =
        entity.placementType === EntityPlacementType.EDGE
          ? min1 === 5
            ? 0
            : min1 + 1
          : min1;

      const start = this.mesh.worldToLocal(this.getVertexWorldPosition(min1));
      const end = this.mesh.worldToLocal(this.getVertexWorldPosition(min2));

      this._placementRotMat.lookAt(end, start, entity.up);
      this._placementTargetQuat.setFromRotationMatrix(this._placementRotMat);
      entity.quaternion.set(
        this._placementTargetQuat.x,
        this._placementTargetQuat.y,
        this._placementTargetQuat.z,
        this._placementTargetQuat.w
      );

      if (entity.placementType === EntityPlacementType.VERTEX)
        this.addVertEntityToNeighbors(entity);
      else if (entity.placementType === EntityPlacementType.EDGE) {
        this.addEdgeEntityToNeighbors(entity);
      }
    } else {
      entity.rotation.x = -90 * Engine.DEG_TO_RAD;
    }

    entity.ignoreRay = false;

    return true;
  }

  private _sharedVertEntities: {
    entity: MeshEntity;
    owner: Tile;
    vertex: number;
    ownerVertex: number;
  }[] = [] as {
    entity: MeshEntity;
    owner: Tile;
    vertex: number;
    ownerVertex: number;
  }[];
  public get sharedVertEntities(): {
    entity: MeshEntity;
    owner: Tile;
    vertex: number;
    ownerVertex: number;
  }[] {
    return this._sharedVertEntities;
  }

  private _sharedEdgeEntities: {
    entity: MeshEntity;
    owner: Tile;
    edge: number;
    ownerEdge: number;
  }[] = [] as {
    entity: MeshEntity;
    owner: Tile;
    edge: number;
    ownerEdge: number;
  }[];
  public get sharedEdgeEntities(): {
    entity: MeshEntity;
    owner: Tile;
    edge: number;
    ownerEdge: number;
  }[] {
    return this._sharedEdgeEntities;
  }

  private addVertEntityToNeighbors(entity: MeshEntity) {
    let neighs = this.getVertexNeighbors(entity.placementVertex);

    for (const neigh of neighs) {
      neigh.tile?._sharedVertEntities.push({
        entity: entity,
        owner: this,
        vertex: neigh.vertex,
        ownerVertex: entity.placementVertex,
      });
    }
  }

  private addEdgeEntityToNeighbors(entity: MeshEntity) {
    let neighs = this.getEdgeNeighbors(entity.placementEdge);

    for (const neigh of neighs) {
      neigh.tile?._sharedEdgeEntities.push({
        entity: entity,
        owner: this,
        edge: neigh.edge,
        ownerEdge: entity.placementEdge,
      });
    }
  }

  public removeEntity(entity: MeshEntity, dispose: boolean): boolean {
    if (entity.placementType === EntityPlacementType.EDGE)
      this.removeEdgeEntityFromNeighbors(entity);
    else if (entity.placementType === EntityPlacementType.VERTEX)
      this.removeVertEntityFromNeighbors(entity);

    const i = this.entities.findIndex((e) => e.id === entity.id);
    if (i !== -1) {
      this.entities.splice(i, 1);
      this.mesh.remove(entity);

      if (dispose) entity.dispose();

      return true;
    }

    return false;
  }

  public removeAllEntities() {
    for (const entity of this.entities) {
      this.cell?.grid?.map?.removeEntityFromTile(entity);
    }
  }

  private removeVertEntityFromNeighbors(entity: MeshEntity) {
    let neighs = this.getVertexNeighbors(entity.placementVertex);

    for (const neigh of neighs) {
      const obj = neigh.tile?._sharedVertEntities.find(
        (x) => x.entity.id === entity.id
      );

      if (obj) {
        const index = neigh.tile?._sharedVertEntities.findIndex(
          (e) => e.entity.id === obj.entity.id
        );

        if (index !== -1) neigh.tile?._sharedVertEntities.splice(index, 1);
      }
    }
  }

  private removeEdgeEntityFromNeighbors(entity: MeshEntity) {
    let neighs = this.getEdgeNeighbors(entity.placementEdge);

    for (const neigh of neighs) {
      const obj = neigh.tile?._sharedEdgeEntities.find(
        (x) => x.entity.id === entity.id
      );
      if (obj) {
        const index = neigh.tile?._sharedEdgeEntities.findIndex(
          (e) => e.entity.id === obj.entity.id
        );

        if (index !== -1) neigh.tile?._sharedEdgeEntities.splice(index, 1);
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
    Tile._tileTypes = {};
  }

  protected _generateTileElevationAndMoisture(): {
    elevation: number;
    moisture: number;
  } {
    const nx = this.cell.q / this.cell.width - 0.5,
      ny = this.cell.r / this.cell.length - 0.5;

    let e =
      1.0 * Engine.Tools.noise1(1 * nx, 1 * ny) +
      0.5 * Engine.Tools.noise1(2 * nx, 2 * ny) +
      0.25 * Engine.Tools.noise1(4 * nx, 4 * ny) +
      0.13 * Engine.Tools.noise1(8 * nx, 8 * ny) +
      0.06 * Engine.Tools.noise1(16 * nx, 16 * ny) +
      0.03 * Engine.Tools.noise1(32 * nx, 32 * ny);
    e /= 1.0 + 0.5 + 0.25 + 0.13 + 0.06 + 0.03;
    e = Math.pow(e, 5.0);
    let m =
      1.0 * Engine.Tools.noise2(1 * nx, 1 * ny) +
      0.75 * Engine.Tools.noise2(2 * nx, 2 * ny) +
      0.33 * Engine.Tools.noise2(4 * nx, 4 * ny) +
      0.33 * Engine.Tools.noise2(8 * nx, 8 * ny) +
      0.33 * Engine.Tools.noise2(16 * nx, 16 * ny) +
      0.5 * Engine.Tools.noise2(32 * nx, 32 * ny);
    m /= 1.0 + 0.75 + 0.33 + 0.33 + 0.33 + 0.5;

    return { elevation: e, moisture: m };
  }

  protected borderLines: Line;

  protected abstract addBorder();
}
