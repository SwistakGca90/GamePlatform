var Parser = require('binary-parser').Parser;
var StringOptions = {length: 99, zeroTerminated: true};

module.exports = PacketModels = {

    header: new Parser().skip(1)
        .string("command", StringOptions),

    login: new Parser().skip(1)
        .string("command", StringOptions)
        .string("username", StringOptions)
        .string("password", StringOptions),

    register: new Parser().skip(1)
        .string("command", StringOptions)
        .string("username", StringOptions)
        .string("password", StringOptions),

    pos: new Parser().skip(1)
        .string("command", StringOptions)
        .int32le("target_x", StringOptions)
        .int32le("target_y", StringOptions)
        .string("player_room", StringOptions)
        .int32le("userhp", StringOptions)
        .int32le("userhplow", StringOptions),

    posm: new Parser().skip(1)
        .string("command", StringOptions)
        .int32le("target_x", StringOptions)
        .int32le("target_y", StringOptions)
        .string("name", StringOptions)
        .int32le("number", StringOptions)
        .string("currently_room", StringOptions),

    room: new Parser().skip(1)
        .string("command", StringOptions)
        .int32le("target_x", StringOptions)
        .int32le("target_y", StringOptions)
        .string("player_room", StringOptions),



    test: new Parser().skip(1)
        .string("command", StringOptions)
}