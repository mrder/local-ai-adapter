'use strict';

const utils = require('@iobroker/adapter-core'); // Importiert ioBroker-Basismodul
const axios = require('axios'); // Importiert Axios für HTTP-Anfragen

class LocalAIAdapter extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'local-ai-adapter',
        });

        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        this.log.info('Adapter gestartet, Konfiguration wird geladen...');
	if (!this.aiServerURL.startsWith('http')) {
		this.log.error('Ungültige URL für den AI-Server. Bitte prüfen Sie die Einstellungen.');
		return;
	}

        // URL und API-Key aus den Einstellungen laden
        this.aiServerURL = this.config.aiServerURL || 'http://localhost:8000';
        this.apiKey = this.config.apiKey || '';

        this.log.info(`Verbindung zu LocalAI-Server unter: ${this.aiServerURL}`);
        if (this.apiKey) {
            this.log.info(`Verwende API-Key: ${this.apiKey}`);
        }

        // Beispielanfrage an den LocalAI-Server
        try {
            const response = await this.sendAIRequest("Wie ist das Wetter?");
            this.log.info(`Antwort vom LocalAI-Server: ${response}`);
        } catch (error) {
            this.log.error(`Fehler bei der Anfrage: ${error.message}`);
        }
    }

    async sendAIRequest(input) {
        const headers = this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {};
        try {
            const response = await axios.post(this.aiServerURL, { input }, { headers });
            return response.data; // Gibt die Antwortdaten zurück
        } catch (error) {
            this.log.error(`Fehler bei der Anfrage an den AI-Server: ${error.message}`);
            throw error;
        }
    }

    async onStateChange(id, state) {
        if (state && !state.ack) {
            const input = state.val;
            try {
                // Anfrage an den LocalAI-Server senden
                const response = await this.sendAIRequest(input);
                this.log.info(`Antwort vom AI-Server: ${response}`);
                // Setze den neuen State mit der Antwort
                await this.setStateAsync(id, { val: response, ack: true });
            } catch (error) {
                this.log.error(`Fehler bei der AI-Anfrage: ${error.message}`);
            }
        }
    }

    onUnload(callback) {
        try {
            this.log.info('Adapter wird heruntergefahren...');
            callback();
        } catch (e) {
            callback();
        }
    }
}

if (module.parent) {
    module.exports = (options) => new LocalAIAdapter(options);
} else {
    new LocalAIAdapter();
}
