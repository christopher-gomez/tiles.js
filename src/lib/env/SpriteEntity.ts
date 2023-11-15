import { SpriteMaterial, TextureLoader, Sprite, BufferGeometryLoader, ObjectLoader } from "three";

export interface SpriteEntityJSONData {
    spritePath: string;
    geometryJSON: any;
    position: number[];
    rotation: number[];
    scale: number[];
}

export default class SpriteEntity {

    private static loader: TextureLoader = new TextureLoader();

    private _material: SpriteMaterial;

    public get material() { return this._material }

    private _sprite: Sprite;

    public get sprite() { return this._sprite }

    public onHighlight: () => void;
    public onUnHighlight: () => void;
    public onSelect: () => void;

    private _spritePath: string;

    static createSprite(spritePath: string, onComplete?: (sprite: SpriteEntity) => void): SpriteEntity {
        return new SpriteEntity(spritePath, onComplete);
    }

    private constructor(spritePath: string, onComplete?: (sprite: SpriteEntity) => void) {

        SpriteEntity.loader.load(spritePath, (map) => {
            this._material = new SpriteMaterial({ map: map });
            this._sprite = new Sprite(this._material);
            this._spritePath = spritePath;

            this._sprite.userData.structure = this;
            this._sprite.geometry.computeBoundingBox();

            if (onComplete) onComplete(this);
        });
    }

    public toJSON(): SpriteEntityJSONData {
        const geometryJSON = this._sprite.geometry.toJSON();

        return { spritePath: this._spritePath, geometryJSON, position: this._sprite.position.toArray(), rotation: this._sprite.rotation.toArray(), scale: this._sprite.scale.toArray() }
    }

    static loadSprite(data: SpriteEntityJSONData, onComplete?: (sprite: SpriteEntity) => void): SpriteEntity {
        return this.createSprite(data.spritePath, (sprite) => {
            sprite._sprite.position.fromArray(data.position);
            sprite._sprite.rotation.fromArray(data.rotation);
            sprite._sprite.scale.fromArray(data.scale);
            
            if (onComplete) onComplete(sprite);
        });
    }
}