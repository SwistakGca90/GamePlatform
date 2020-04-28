var now = require('performance-now');
var _ = require('underscore');

module.exports = function(){

    var client = this

    //Inicjalizacyjne
    this.initiate = function(){

        //prześlij informacje o polaczanym pakiecie
        client.socket.write(packet.build(['HELLO', now().toString()]));
        console.log('client initiated');

    }

    //Metody Klienta
    this.entergame = function(selected_room, target_x, target_y){
        maps[selected_room].clients.push(client);

        maps[selected_room].clients.forEach(function(otherClient){
            otherClient.socket.write(packet.build(["ENTER", client.user.username, target_x, target_y, client.user.current_room]))
        })

        maps[selected_room].mobs.forEach(function(dane){
            for(var i = 1; i <= dane.mobcount; i++) {
                Mobs.login(selected_room, i, dane.mobname, function (result, res) {
                    if (result && res.mobstatus != 'D') {
                        client.socket.write(packet.build(["MOBS", res.mobnumber, res.mobname, res.mobhp, res.pos_x, res.pos_y, res.mobroom]));
                    }
                });
            }
        });
    };

    this.broadcastroom = function(packetData){
        maps[client.user.current_room].clients.forEach(function(otherClient){
            if(otherClient.user.username != client.user.username){
                otherClient.socket.write(packetData);
            }
        })
    }

    this.enterroom = function(newRoom, newX, newY) {
        maps[newRoom].clients.push(client);

        maps[newRoom].clients.forEach(function(otherClient){
            if(otherClient.user.username != client.user.username){
                otherClient.socket.write(packet.build(["POS", client.user.username, newX, newY, newRoom]));
            }
        });

        maps[newRoom].mobs.forEach(function(dane){
            for(var i = 1; i <= dane.mobcount; i++) {
                Mobs.login(newRoom, i, dane.mobname, function (result, res) {
                    if (result && res.mobstatus != 'D') {
                        client.socket.write(packet.build(["MOBS", res.mobnumber, res.mobname, res.mobhp, res.pos_x, res.pos_y, res.mobroom]));
                    }
                });
            }
        });
    }

    this.exitroom = function(oldRoom, newRoom, newX, newY){
        maps[oldRoom].clients.forEach(function(otherClient){
            if(otherClient.user.username != client.user.username){
                otherClient.socket.write(packet.build(["POS", client.user.username, newX, newY, newRoom]))
            }
        })
        var foundIndex = maps[oldRoom].clients.findIndex(x => x.user.username === client.user.username);
        maps[oldRoom].clients.splice(foundIndex, 1);
    }

    //Itemy Socketa
    this.data = function(data){
        packet.parse(client, data);
    }

    this.error = function(err){
        //client.user.save();
        console.log('jakis error');
    }

    this.end = function(){
        if (client.user != null) {
            client.user.save();
            client.broadcastroom(packet.build(["PLOGOUT", client.user.username]));

            //usuwanie gracza z tablicy mapy
            var foundIndex = maps[client.user.current_room].clients.findIndex(x => x.user.username === client.user.username);
            maps[client.user.current_room].clients.splice(foundIndex, 1);
        }
    }
}