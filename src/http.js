import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { log } from './log/log.js';
import CONFIG from './config.js';
import { app, validate } from './http/expressBootstrap.js';
import BulbController from "./controller/bulbController.js";
import Scenes from "./wiz/scenes.js";

const bulbController = new BulbController;

export default new function() {
    app.get('/state', async (req, res) => {
        return res.json(await bulbController.getState());
    });

    app.put('/state', async (req, res) => {
        return res.json(await bulbController.setState(req.body));
    });

    app.post('/on', validate([
        body('dimming').isNumeric().optional().custom(value => parseInt(value) >= 1 && parseInt(value) <= 100)
    ]), async (req, res) => {
        const dimming = req.body.dimming ? parseInt(req.body.dimming) : 100;
        req.log.info('Bulbs on ' + dimming);
        return res.json(await bulbController.turnOn(dimming));
    });

    app.post('/off', async (req, res) => {
        req.log.info('Bulbs off');
        return res.json(await bulbController.turnOff());
    });

    app.post('/dimming', validate([
        body('dimming').isNumeric().optional().custom(value => parseInt(value) >= 1 && parseInt(value) <= 100)
    ]), async (req, res) => {
        const dimming = req.body.dimming ? parseInt(req.body.dimming) : 100;
        req.log.info('Bulbs dimming ' + dimming);
        return res.json(await bulbController.setDimming(dimming));
    });

    app.post('/color', validate([
        body('color').isString().custom(value => value.match(/#?[0-9A-Fa-f]{6}/) !== null),
        body('dimming').isNumeric().optional().custom(value => parseInt(value) >= 1 && parseInt(value) <= 100),
        body('cold').isNumeric().optional().custom(value => parseInt(value) >= 0 && parseInt(value) <= 244),
        body('warm').isNumeric().optional().custom(value => parseInt(value) >= 0 && parseInt(value) <= 244),
    ]), async (req, res) => {
        const hex = req.body.color.replace(/(#)?([0-9A-Fa-f]{6})/, '#$2');
        const dimming = req.body.dimming ? parseInt(req.body.dimming) : 100;
        const cold = req.body.cold ? parseInt(req.body.cold) : 0;
        const warm = req.body.warm ? parseInt(req.body.warm) : 0;
        req.log.info('Bulbs color ' + hex + ' ' + dimming + ' ' + cold + ' ' + warm);
        return res.json(await bulbController.setColour(hex, dimming, cold, warm));
    });

    app.post('/scene', validate([
        body('scene').isString().custom(value => Object.keys(Scenes).indexOf(value) !== -1)
    ]), async (req, res) => {
        req.log.info('Bulbs scene ' + req.body.scene);
        return res.json(await bulbController.setScene(req.body.scene));
    });

    this.start = function() {
        // logging example - docs: https://github.com/pinojs/pino/tree/185dc159166d8d31471a31532fede220d5a8d588
        log.debug('Starting HTTP on port ' + CONFIG.httpPort);
        if (CONFIG.httpAuth) {
            log.debug('HTTP auth enabled with with secret ' + CONFIG.httpAuthSecret);
            log.debug('HTTP auth access token: ' + jwt.sign({}, CONFIG.httpAuthSecret, {algorithm: CONFIG.httpAuthAlgorithm}));
        } else {
            log.debug('HTTP auth disabled');
        }
        app.listen(CONFIG.httpPort);
        log.info('HTTP listening on ' + CONFIG.httpPort);
    };
};