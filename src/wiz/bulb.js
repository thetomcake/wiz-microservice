import dgram from 'dgram';
import hexRgb from 'hex-rgb';
import Scenes from "./scenes.js";

const SEND_PORT = 38899;

export default class Bulb {
    constructor(host) {
        this.socket = dgram.createSocket('udp4');
        this.host = host;
        this.currentState = null;
        this.currentStateAccept = null;

        this.socket.on('message', (msg, rinfo) => {
            const result = JSON.parse(msg.toString());
            if (result.method === 'getPilot' && this.currentStateAccept !== null) {
                this.currentStateAccept(result.result);
                this.currentStateAccept = null;
                this.currentState = null;
            }
        });
    }
    getHost() {
        return this.host;
    }

    async getPilot() {
        const msg = JSON.stringify({method: 'getPilot'});
        this.socket.send(msg, 0, msg.length, SEND_PORT, this.host);
        this.currentState = new Promise(accept => {
            this.currentStateAccept = accept;
        });
        return this.currentState;
    }

    /**
     * 1 to 100
     * @param dimming
     */
    setDimming(dimming) {
        this.setPilot({
            dimming,
        });
    }
    setColour(hex, dimming = 100, cold = 0, warm = 0) {
        if (typeof hex === 'object') {
            return this.setPilot({...hex, dimming});
        }
        const rgb = hexRgb(hex);
        this.setPilot({
            c: Math.min(244, Math.max(0, cold)),
            w: Math.min(244, Math.max(0, warm)),
            r: rgb.red,
            g: rgb.green,
            b: rgb.blue,
            dimming,
        });
    }
    setScene(sceneId, temperature = null) {
        if (typeof sceneId === 'string') {
            sceneId = Scenes[sceneId] || Scenes.Daylight;
        }
        let data = {
            sceneId
        };
        if (temperature !== null) {
            data.temp = Math.min(6500, Math.max(2200, temperature))
        }
        this.setPilot(data);
    }
    turnOn(dimming = 100) {
        this.setPilot({
            state: true,
            dimming,
        });
    }
    turnOff() {
        this.setPilot({
            state: false,
        });
    }
    setPilot(params) {
        if (params.dimming) {
            params.dimming = Math.round(10 + ((90 / 100) * params.dimming));
        }
        const msg = JSON.stringify({ method: 'setPilot', params });
        this.socket.send(msg, 0, msg.length, SEND_PORT, this.host);
    }
}