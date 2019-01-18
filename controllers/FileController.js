const csv = require('csv');
const StreamArray = require('stream-json/streamers/StreamArray');
const { Transform } = require('stream');
const config = require('config');

const kafka = require('kafka-node'),
    KafkaClient = kafka.KafkaClient,
    Producer = kafka.Producer,
    KeyedMessage = kafka.KeyedMessage;

module.exports = {
    batchController: (busboy, callback) => {
        busboy.on('file', (fieldname, file, filename) => {
            const type = filename.split(".")[1];
            const name = filename.split(".")[0];
            callback(file, type, name)
        });
    },
    fileTypeHandler: (file, type, name, vendorId) => {
        let streamer;
        try {
            streamer = {
                'json': () => file.pipe(StreamArray.withParser()),
                'csv': () => file.pipe(csv.parse({columns: true}))
            }[type]();
            return new FileController(streamer, type, name, vendorId)
        } catch (e) {
            streamer.unpipe()
        }
    }
}


class FileController {
    constructor(streamer, type, name, vendorId) {
        this.error = undefined;
        this.vendorId = vendorId;
        this.name = name;
        this.type = type;
        this.streamer = streamer;
        this.jsonValue = new Transform({
            readableObjectMode: true,
            writableObjectMode: true,
            transform(chunk, encoding, callback) {
                this.push({...chunk.value});
                callback();
            }
        });
        this.csvToJson = new Transform({
            readableObjectMode: true,
            writableObjectMode: true,
            transform(chunk, encoding, callback) {
                this.push(chunk);
                callback();
            }
        });
    }


    getKafkaProducer(callback) {
        // Need to be config
        const client = new KafkaClient({kafkaHost: config.get("kafkaHost"), requestTimeout: 1800000});
        const producer = new Producer(client, {requireAcks:0});
        producer.on('error', function (err) {
            console.log(err);
        });

        producer.on('ready', function () { // KafkaProducer on ready
            callback(producer)
        });
    }

    toJson() {
        this.streamer = this.streamer.pipe(this.type === 'json' ? this.jsonValue : this.csvToJson);
        return this;
    }

    printOut() {
        this.streamer.pipe(process.stdout)
    }

    unpipe() {
        this.streamer.unpipe()
    }

    produceKafkaWithKey() {
        try {
            const {name, vendorId} = this;
            const keys = config.get("kafkaKeys")[name];
            const topic = name;
            this.getKafkaProducer(producer => {
                this.streamer.on('data', async data => {
                    const key = keys.map(k => k + '_' + data[k]).join('_');
                    const km = new KeyedMessage(key, JSON.stringify({vendorId, ...data}));
                    const payloads = [
                        {topic, key, messages: km}
                    ];
                    producer.send(payloads, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                });
            });
            return this;
        } catch (e) {
            return this;
        }
    }

    onError(errFunc) {
        this.streamer.on('error', errFunc);
        return this;
    }

    lastHandler(resFunc, errFunc) {
        this.streamer.on('end', resFunc);
        this.streamer.on('error', errFunc);
    }
}