import Config from "../config.js";
import Bulb from "../wiz/bulb.js";
import rgbHex from 'rgb-hex';

export default class BulbController {
    constructor() {
        this.ips  = Config.bulbIps;
        this.bulbs = this.ips.map(ip => new Bulb(ip));
    }
    async setState(state) {
        let resultPromises = [];
        this.bulbs.forEach(bulb => {
            resultPromises.push(new Promise(async accept => {
                bulb.getPilot().then(async bulbState => {
                    const newBulbData = state.find(stateItem => stateItem.mac === bulbState.mac);
                    if (!newBulbData) {
                        return accept();
                    }
                    const newBulbState = newBulbData.state;

                    const oldSceneId = bulbState.sceneId;
                    const newSceneId = typeof newBulbState.sceneId === 'number' ? newBulbState.sceneId : oldSceneId;

                    const oldTemperature = bulbState.temp || null;
                    const newTemperature = newSceneId !== 0 && typeof newBulbState.temp === 'number' ? newBulbState.temp : oldTemperature;

                    const oldDimming = bulbState.dimming;
                    const newDimming = typeof newBulbState.dimming === 'number' ? newBulbState.dimming : oldDimming;

                    const oldState = bulbState.state;
                    const newState = typeof newBulbState.state === 'boolean' ? newBulbState.state : oldState;

                    const newColor = typeof newBulbState.r === 'number' && typeof newBulbState.g === 'number' && typeof newBulbState.b === 'number' ?
                        rgbHex(newBulbState.r, newBulbState.g, newBulbState.b) :
                        null;
                    const newCold = newColor !== null && typeof newBulbState.c === 'number' ? newBulbState.c : (bulbState.c || 0);
                    const newWarm = newColor !== null && typeof newBulbState.w === 'number' ? newBulbState.w : (bulbState.w || 0);


                    if (oldSceneId !== newSceneId) {
                        bulb.setScene(newSceneId, newTemperature);
                    } else if (newColor !== null) {
                        bulb.setColour(newColor, newDimming, newCold, newWarm);
                    }
                    if (newDimming !== oldDimming) {
                        bulb.setDimming(newDimming);
                    }
                    if (newState !== oldState) {
                        newState === true ? bulb.turnOn(newDimming) :  bulb.turnOff();
                    }
                    accept();
                });
            }));
        });
        await Promise.all(resultPromises);
        return this.getState();
    }
    async getState() {
        let state = [];
        let statePromises = this.bulbs.map(bulb => bulb.getPilot().then(bulbState => state.push({host: bulb.getHost(), mac: bulbState.mac, state: bulbState})));
        return Promise.all(statePromises).then(result => state);
    }
    async setDimming(dimming) {
        this.bulbs.forEach(bulb => bulb.setDimming(dimming));
        return this.getState();
    }
    async setColour(hex, dimming = 100,  cold = 0, warm = 0) {
        this.bulbs.forEach(bulb => bulb.setColour(hex, dimming, cold, warm));
        return this.getState();
    }
    async setScene(sceneId) {
        this.bulbs.forEach(bulb => bulb.setScene(sceneId));
        return this.getState();
    }
    async turnOn(dimming = 100) {
        this.bulbs.forEach(bulb => bulb.turnOn(dimming));
        return this.getState();
    }
    async turnOff() {
        this.bulbs.forEach(bulb => bulb.turnOff());
        return this.getState();
    }
}