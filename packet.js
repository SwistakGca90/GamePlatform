var zeroBuffer = new Buffer('00', 'hex');

module.exports = packet = {

    //params; tablica obiektów  ktore zostana zmienione w buffery
    build: function(params){

        var packetParts = [];
        var packetSize = 0;

        params.forEach(function(param){
            var buffer;
            if(typeof param === 'string'){
                buffer = new Buffer(param, 'utf8');
                buffer = Buffer.concat([buffer, zeroBuffer], buffer.length + 1)
            }
            else if (typeof param === 'number') {
                buffer = new Buffer(2);
                buffer.writeUInt16LE(param, 0);
            }
            else{
                console.log("WARNING: Unknown data type in packet builder!");
            }

            packetSize += buffer.length;
            packetParts.push(buffer);
        })
        var dataBuffer = Buffer.concat(packetParts, packetSize);

        var size = new Buffer(1);
        size.writeUInt8(dataBuffer.length + 1,0);

        var finalPacket = Buffer.concat([size, dataBuffer],size.length + dataBuffer.length);

        return finalPacket;

    },


    //Parsowanie pakietu otrzymanego od klienta
    parse: function(c, data){

        var idx = 0;

        while( idx < data.length ){

            var packetSize = data.readUInt8(idx);
            var extractedPacket = new Buffer(packetSize);
            data.copy(extractedPacket, 0, idx, idx + packetSize);
            this.interpret(c, extractedPacket);
            idx += packetSize;

        }

    },

    interpret: function(c, datapacket){

        var header = PacketModels.header.parse(datapacket);

        switch (header.command.toUpperCase()){

            case "LOGIN":
                var data = PacketModels.login.parse(datapacket);
                User.login(data.username, data.password, function(result, user){
                    console.log('Login Result ' + result);
                    if(result){
                        c.user = user;
                        c.entergame(c.user.current_room, c.user.pos_x, c.user.pos_y);
                        c.socket.write(packet.build(["LOGIN", "TRUE", c.user.current_room, c.user.pos_x, c.user.pos_y, c.user.username, c.user.userhp, c.user.usermp, c.user.userhplow, c.user.usermplow]))
                        //dodać wszystkich uzytkownikow ktorzy aktualnie sa zalogowani
                        c.broadcastroom(packet.build(["POS", c.user.username, c.user.pos_x, c.user.pos_y, c.user.current_room, c.user.userhp, c.user.userhplow]));
                    }else{
                        c.socket.write(packet.build(["LOGIN", "FALSE"]))
                    }
                })
                break;

            case "REGISTER":
                var data = PacketModels.register.parse(datapacket);
                User.register(data.username, data.password, function(result){
                    if(result){
                        c.socket.write(packet.build(["REGISTER", "TRUE"]))
                    }else{
                        c.socket.write(packet.build(["REGISTER", "FALSE"]))
                    }
                });
                break;

            case "POS":
                var data = PacketModels.pos.parse(datapacket);
                c.user.pos_x = data.target_x;
                c.user.pos_y = data.target_y;
                c.user.userhp = data.userhp;
                c.user.userhplow = data.userhplow;
                c.broadcastroom(packet.build(["POS", c.user.username, data.target_x, data.target_y, data.player_room, data.userhp, data.userhplow]));
                break;

            case "POSM":
                var data = PacketModels.posm.parse(datapacket);
                    Mobs.save(data.currently_room, data.number, data.name, data.target_x, data.target_y, function (result, res) {
                        if (result) {
                            c.broadcastroom(packet.build(["POSM",  data.target_x, data.target_y, data.name, data.number]));
                        }
                    });
                //
                break;

            case "ROOM":
                var data = PacketModels.room.parse(datapacket);
                c.exitroom(c.user.current_room, data.player_room, data.target_x, data.target_y);
                c.user.pos_x = data.target_x;
                c.user.pos_y = data.target_y;
                c.user.current_room = data.player_room;
                c.user.save();
                c.enterroom(data.player_room,data.target_x,data.target_y);
                break;

            case "TEST":
                var foundIndex = maps["wk_map_home"].clients.findIndex(x => x.user.username == c.user.username);
                console.log(c.user.username + '  ' + foundIndex);

                var foundIndex = maps["wk_map_home"].clients.findIndex(x => x.user.username === c.user.username);
                console.log(c.user.username + '  ' + foundIndex);

                break;
        }
    }
}