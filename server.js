const express = require('express');
const mqtt = require('mqtt');
const path = require('path');

const app = express();
const PORT = 3000;

// MQTT Asetukset antamillasi tiedoilla
const brokerUrl = 'mqtt://automaatio:Z0od2PZF65jbtcXu@automaatio.cloud.shiftr.io';
const topicName = 'ryhma0';

// Yhdistetään MQTT-välittäjään
const mqttClient = mqtt.connect(brokerUrl);

mqttClient.on('connect', () => {
    console.log('✓ Yhteys MQTT-välittäjään (Shiftr.io) muodostettu onnistuneesti.');
});

mqttClient.on('error', (err) => {
    console.error('❌ MQTT-yhteysvirhe:', err);
});

// Middlewaret datan käsittelyyn ja staattisille tiedostoille
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rajapinta, johon selain lähettää lomakkeen tiedot
app.post('/send-mqtt', (req, res) => {
    const data = req.body;

    // Varmistetaan että MQTT-asiakas on linjoilla
    if (!mqttClient.connected) {
        return res.status(500).json({ error: 'MQTT-palvelimeen ei ole yhteyttä juuri nyt.' });
    }

    // Muutetaan data JSON-merkkijonoksi
    const jsonMessage = JSON.stringify(data);

    // Julkaistaan viesti MQTT-aiheeseen
    mqttClient.publish(topicName, jsonMessage, { qos: 1 }, (err) => {
        if (err) {
            console.error('Viestin lähetys epäonnistui:', err);
            return res.status(500).json({ error: 'Viestin lähetys MQTT-palvelimelle epäonnistui.' });
        }
        
        console.log(`[MQTT] Viesti lähetetty aiheeseen "${topicName}":`, jsonMessage);
        return res.status(200).json({ message: 'Tiedot lähetetty onnistuneesti MQTT-verkkoon!' });
    });
});

// Käynnistetään palvelin
app.listen(PORT, () => {
    console.log(`\n🚀 Palvelin käynnissä osoitteessa: http://localhost:${PORT}`);
});
