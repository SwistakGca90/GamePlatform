
// sciaganie waznych bibliotek
var args = require('minimist')(process.argv.slice(2));
var extand = require('extend');

//Uzupelnianie rodzaju srodowiska test lub prod
var environment = args.env || "test";
//console.log(environment);

//Configuracja
var common_conf = {
    name: "Moja pierwasza gra mmo",
    version: "0.0.1",
    environment: environment,
    max_players: 100,
    data_paths: {
        items: __dirname + "\\Game Data\\" + "Items\\",
        maps: __dirname + "\\Game Data\\" + "Maps\\",
        mobs: __dirname + "\\Game Data\\" + "Mobs\\"
    },
    starting_zone: "wk_map_home"
};

//Specyficzne configuracje srodowiska
var conf = {
    production:{
        ip: args.ip || "0.0.0.0",
        port: args.port ||8085,
        database: "mongodb://127.0.0.1/wkmmo_prod"
    },

    test:{
        ip: args.ip || "0.0.0.0",
        port: args.port ||8084,
        database: "mongodb://127.0.0.1/wkmmo_test"
    },

    alfa_prod: {
        ip: args.ip || "0.0.0.0",
        port: args.port ||8086,
        database: "mongodb://127.0.0.1/wkmmo_alfaprod"
    }
};

extand(false,conf.production, common_conf);
extand(false,conf.test, common_conf);
extand(false,conf.alfa_prod, common_conf);


module.exports = config = conf[environment];
