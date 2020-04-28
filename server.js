//importowanie wymaganych bibliotek
require(__dirname + '/Resources/config.js');
var fs = require('fs');
var net = require('net');
require('./packet.js');


//1. ladowanie inicjalizacyjne
var init_files = fs.readdirSync(__dirname + "/Initializers");
init_files.forEach(function(initFile){
    console.log('Loading Initializers: ' + initFile);
    require(__dirname + "/initializers/" + initFile);
});

//2. ladowanie modeli daty
var model_files = fs.readdirSync(__dirname + "/Models");
model_files.forEach(function(modelFile){
    console.log('Loading Model: ' + modelFile);
    require(__dirname + "/Models/" + modelFile);
});


//3. ladowanie map
maps = {};

var map_files = fs.readdirSync(config.data_paths.maps);
map_files.forEach(function(mapFile){
    console.log('Loading Map: ' + mapFile);
    var map = require(config.data_paths.maps + mapFile);
    maps[map.room] = map;
});


/*
mobs ={};
var mobs_files = fs.readdirSync(config.data_paths.mobs);
mobs_files.forEach(function(mobsFiles){
    console.log('Loading Mob: ' + mobsFiles);
    var mob = require(config.data_paths.mobs + mobsFiles);
    mobs[mob.name,mob.room] = mob;
});*/

net.createServer(function(socket){

    console.log("socked connected");
    var c_inst = new require('./client.js');
    var thisClient = new c_inst();

    thisClient.socket = socket;
    thisClient.initiate();

    socket.on('error', thisClient.error);

    socket.on('end', thisClient.end);

    socket.on('data', thisClient.data);

}).listen(config.port);

console.log("Initializing Completed, Server running on port: " + config.port + " for environment: " + config.environment);
//4. inicjalizacja servera i nasłuchiwanie