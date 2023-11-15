import {
  DoubleSide,
  Font,
  FontLoader,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  TextGeometry,
} from "three";
import Tools from "../utils/Tools";
import GentilisBold from "../../Assets/fonts/gentilis_bold.typeface.json";
import GentilisRegular from "../../Assets/fonts/gentilis_regular.typeface.json";
import HelvetikerBold from "../../Assets/fonts/helvetiker_bold.typeface.json";
import HelvetikerRegular from "../../Assets/fonts/helvetiker_regular.typeface.json";
import OptimerBold from "../../Assets/fonts/optimer_bold.typeface.json";
import OptimerRegular from "../../Assets/fonts/optimer_regular.typeface.json";
import DroidSansBold from "../../Assets/fonts/droid/droid_sans_bold.typeface.json";
import DroidSansRegular from "../../Assets/fonts/droid/droid_sans_regular.typeface.json";
import DroidSerifBold from "../../Assets/fonts/droid/droid_serif_bold.typeface.json";
import DroidSerifRegular from "../../Assets/fonts/droid/droid_serif_regular.typeface.json";
import { MeshTextJSONData } from "../utils/Interfaces";

export enum MeshTextFonts {
  helvetiker,
  optimer,
  gentilis,
  droid_sans,
  droid_serif,
}

export enum MeshTextFontWeights {
  regular,
  bold,
}

export interface MeshTextSettings {
  font: MeshTextFonts;
  fontWeight: MeshTextFontWeights;

  mirror: boolean;

  height: number;
  size: number;
  hover: number;

  curveSegments: number;

  bevelEnabled: boolean;
  bevelThickness: number;
  bevelSize: number;

  faceColor: number | string;
  outlineColor: number | string;
}

export interface MeshTextSettingsParam {
  font?: MeshTextFonts;
  fontWeight?: MeshTextFontWeights;

  mirror?: boolean;

  height?: number;
  size?: number;
  hover?: number;

  curveSegments?: number;

  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;

  faceColor?: number | string;
  outlineColor?: number | string;
}

export default class MeshText {
  private _text = "three.js";
  public get text() {
    return this._text;
  }

  private font: Font = undefined;

  private static fontMap = {
    helvetiker: 0,
    optimer: 1,
    gentilis: 2,
    "droid/droid_sans": 3,
    "droid/droid_serif": 4,
  };

  private static weightMap = {
    regular: 0,
    bold: 1,
  };

  private static regularFontAssets = {
    helvetiker: HelvetikerRegular,
    optimer: OptimerRegular,
    gentilis: GentilisRegular,
    "droid/droid_sans": DroidSansRegular,
    "droid/droid_serif": DroidSerifRegular,
  };

  private static boldFontAssets = {
    helvetiker: HelvetikerBold,
    optimer: OptimerBold,
    gentilis: GentilisBold,
    "droid/droid_sans": DroidSansBold,
    "droid/droid_serif": DroidSerifBold,
  };

  private static loader = new FontLoader();

  private static reverseFontMap = [];
  private static reverseWeightMap = [];

  private fontIndex = 1;

  private materials: Material[];

  private _group: Group;
  public get group() {
    return this._group;
  }

  private _textGeo: TextGeometry;
  public get textGeo() {
    return this._textGeo;
  }

  private _textMesh1: Mesh;
  public get textMesh1() {
    return this._textMesh1;
  }

  private _textMesh2: Mesh;
  public get textMesh2() {
    return this._textMesh2;
  }

  private _settings: MeshTextSettings = {
    font: MeshTextFonts.gentilis,
    fontWeight: MeshTextFontWeights.bold,

    mirror: false,

    height: 20,
    size: 70,
    hover: 30,

    curveSegments: 4,

    bevelEnabled: true,
    bevelThickness: 2,
    bevelSize: 1.5,

    faceColor: 0xffffff,
    outlineColor: 0x000000,
  };

  public get settings() {
    return this._settings;
  }

  private static matCache: { [key: string]: Material[] } = {};

  public userData: { [name: string]: any } = {};

  static CreateText(
    textVal: string,
    onLoadComplete?: (obj: MeshText) => void,
    settings?: MeshTextSettingsParam
  ): MeshText {
    return new MeshText(textVal, onLoadComplete, settings);
  }

  private constructor(
    textVal: string,
    private onLoadComplete?: (obj: MeshText) => void,
    settings?: MeshTextSettingsParam
  ) {
    this._settings = Tools.merge(
      this._settings,
      settings || {}
    ) as MeshTextSettings;

    this._text = textVal;

    if (MeshText.reverseFontMap.length == 0)
      for (const i in MeshText.fontMap)
        MeshText.reverseFontMap[MeshText.fontMap[i]] = i;

    if (MeshText.reverseWeightMap.length == 0)
      for (const i in MeshText.weightMap)
        MeshText.reverseWeightMap[MeshText.weightMap[i]] = i;

    let matKey =
      this.settings.faceColor.toString() +
      "-" +
      this.settings.outlineColor.toString();

    if (!(matKey in MeshText.matCache)) {
      MeshText.matCache[matKey] = [
        new MeshBasicMaterial({
          color: this.settings.faceColor,
          flatShading: true,
          wireframe: false,
          reflectivity: 0,
          side: DoubleSide,
        }), // front
        new MeshBasicMaterial({
          color: this.settings.outlineColor,
          side: DoubleSide,
        }), // side
      ];
    }

    this.materials = MeshText.matCache[matKey].map((m) => m.clone());

    this._group = new Group();

    this.loadFont(this.onLoadComplete);

    this._group.userData.structure = this;

    this.userData.structure = this;
  }

  private static meshTextFontToString(font: MeshTextFonts): string {
    let fontString = "";
    let target = -1;
    Object.values(MeshText.fontMap).forEach((val, i) => {
      if (val === (font as number)) {
        target = i;
        return;
      }
    });

    if (target !== -1) {
      fontString = Object.keys(MeshText.fontMap)[target];
    }

    return fontString;
  }

  private static meshTextFontWeightToString(
    weight: MeshTextFontWeights
  ): string {
    let weightString = "";
    let target = -1;
    Object.values(MeshText.weightMap).forEach((val, i) => {
      if (val === (weight as number)) {
        target = i;
        return;
      }
    });

    if (target !== -1) {
      weightString = Object.keys(MeshText.weightMap)[target];
    }

    return weightString;
  }

  private static fontSettingsToAsset(
    font: MeshTextFonts,
    weight: MeshTextFontWeights
  ) {
    let asset;
    if (weight === MeshTextFontWeights.bold) {
      asset = MeshText.boldFontAssets[MeshText.meshTextFontToString(font)];
    } else if (weight === MeshTextFontWeights.regular) {
      asset = MeshText.regularFontAssets[MeshText.meshTextFontToString(font)];
    }

    return asset;
  }

  private static fontCache: { [name: string]: Font } = {};

  public cancelLoad = false;

  private loadFont(onLoadComplete: (obj: MeshText) => void) {
    let fontKey =
      MeshText.meshTextFontToString(this.settings.font) +
      "_" +
      MeshText.meshTextFontWeightToString(this.settings.fontWeight);

    if (!(fontKey in MeshText.fontCache)) {
      let asset = MeshText.fontSettingsToAsset(
        this.settings.font,
        this.settings.fontWeight
      );
      let font = MeshText.loader.parse(asset);
      MeshText.fontCache[fontKey] = font;
    }

    this.font = MeshText.fontCache[fontKey];

    this.refreshText(onLoadComplete);
  }

  private static geoCache: { [key: string]: TextGeometry } = {};

  private createText(onCreateComplete: (obj: MeshText) => void) {
    let fontKey =
      MeshText.meshTextFontToString(this.settings.font) +
      "_" +
      MeshText.meshTextFontWeightToString(this.settings.fontWeight);

    let geoKey =
      this.text +
      "_" +
      fontKey +
      "_" +
      this.settings.size +
      "_" +
      this.settings.height +
      "_" +
      this.settings.curveSegments +
      "_" +
      this.settings.bevelEnabled +
      "_" +
      this.settings.bevelThickness +
      "_" +
      this.settings.bevelSize;

    if (!(geoKey in MeshText.geoCache)) {
      let geo = new TextGeometry(this.text, {
        font: this.font,

        size: this.settings.size,
        height: this.settings.height,
        curveSegments: this.settings.curveSegments,

        bevelThickness: this.settings.bevelThickness,
        bevelSize: this.settings.bevelSize,
        bevelEnabled: this.settings.bevelEnabled,
      });

      geo.computeBoundingBox();
      MeshText.geoCache[geoKey] = geo;
    }

    this._textGeo = MeshText.geoCache[geoKey];

    const centerOffsetX =
      -0.5 * (this.textGeo.boundingBox.max.x - this.textGeo.boundingBox.min.x);
    const centerOffsetY =
      -0.5 * (this.textGeo.boundingBox.max.y - this.textGeo.boundingBox.min.y);
    this._textMesh1 = new Mesh(this.textGeo, this.materials);

    this.textMesh1.position.x = centerOffsetX;
    this.textMesh1.position.y =
      centerOffsetY + (this.settings.mirror ? this.settings.size / 2 : 0);
    this.textMesh1.position.z = this.settings.hover;

    // this.textMesh1.rotation.x = 0;
    // this.textMesh1.rotation.y = Math.PI * 2;

    this.group.add(this.textMesh1);
    this.textMesh1.userData.structure = this;

    if (this.settings.mirror) {
      this._textMesh2 = new Mesh(this.textGeo, this.materials);

      this.textMesh2.position.x = centerOffsetX;
      this.textMesh2.position.y = centerOffsetY;
      this.textMesh2.position.z = this.settings.hover;

      this.textMesh2.rotation.x = Math.PI;
      this.textMesh2.rotation.y = Math.PI * 2;

      this.group.add(this.textMesh2);
      this.textMesh2.userData.structure = this;
    }

    if (this.cancelLoad) return;

    if (onCreateComplete) onCreateComplete(this);
  }

  private refreshText(onRefreshComplete: (obj: MeshText) => void) {
    this.group.remove(this.textMesh1);
    if (this.settings.mirror) this.group.remove(this.textMesh2);

    if (!this.text) return;

    this.createText(onRefreshComplete);
  }

  public toJSON(): MeshTextJSONData {
    return {
      settings: {
        ...this.settings,
        // color: typeof this.settings.color === 'number' ? '0x' + this.settings.color.toString(16) : this.settings.color
      },
      text: this.text,
      groupScale: this.group.scale.toArray(),
    } as MeshTextJSONData;
  }
}
