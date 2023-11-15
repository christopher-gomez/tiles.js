export default abstract class EventEmitter {

    registeredEvents: Map<string, Array<(args?: any) => void>>

    constructor() {
        this.registeredEvents = new Map<string, Array<(args?: any) => void>>();
    }

    public addEventListener(name: string, callback: (args?: any) => void) {
        if (!this.registeredEvents.get(name)) this.registeredEvents.set(name, []);

        this.registeredEvents.get(name).push(callback);
    }

    public removeEventListener(name: string, callback?: (args?: any) => void) {
        if (!this.registeredEvents.get(name)) { return }

        if (callback) {
            const index = this.registeredEvents.get(name).map(f => f.name).indexOf(callback.name);

            if (index !== -1)
                this.registeredEvents.get(name).splice(index, 1);
        } else {
            this.registeredEvents.delete(name);
        }
    }

    protected triggerEvent(name: string, args?: any) {
        this.registeredEvents.get(name)?.forEach(fnc => fnc(args));
    }
}