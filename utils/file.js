const fs = require("fs");
const StreamArray = require('stream-json/streamers/StreamArray');
const csvParse = require('csv-parse');
// const JSONStream = require('JSONStream'); // package need to be remove

const parseBatchFile = async (name, path, output, end) => {
    const postfix = name.split(".")[1]
    console.log(path);
    await {
        "csv": () => {return fs.createReadStream(path).pipe(csvParse())},
        "json": () => {
            const pipeLine = fs.createReadStream(path).pipe(StreamArray.withParser());
            let objectCounter = 0;
            // pipeLine.on('data', output);
            // pipeLine.on('end', end);
            pipeLine.on('data', output);
            pipeLine.on('end', end);
            pipeLine.on('error', err => {
                console.log(err);
            });
        }
    }[postfix]()
}

module.exports = {parseBatchFile};