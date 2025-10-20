const { Buffer } = require('buffer');

const ZERO_BYTE = Buffer.from([0]);

module.exports = packet = {

  // params: array of objects/values to put into a packet
  build: function(params) {

    const packetParts = [];
    let packetSize = 0;

    for (const param of params) {
      let buffer;
      if (typeof param === 'string') {
        const s = Buffer.from(param, 'utf8');
        // append a single zero byte as terminator
        buffer = Buffer.concat([s, ZERO_BYTE], s.length + 1);
      } else if (Number.isInteger(param)) {
        // write as unsigned 16-bit little-endian (keeps previous behavior)
        buffer = Buffer.allocUnsafe(2);
        buffer.writeUInt16LE(param, 0);
      } else {
        console.warn("WARNING: Unknown data type in packet builder!", typeof param);
        continue;
      }

      packetSize += buffer.length;
      packetParts.push(buffer);
    }

    const dataBuffer = Buffer.concat(packetParts, packetSize);

    const sizeBuffer = Buffer.allocUnsafe(1);
    // keep previous semantics: size = data length + 1
    sizeBuffer.writeUInt8(dataBuffer.length + 1, 0);

    return Buffer.concat([sizeBuffer, dataBuffer], 1 + dataBuffer.length);
  },

  // parse raw bytes (possibly containing multiple packets)
  // safe: validates sizes and uses slice to avoid unnecessary copying
  parse: function(c, data) {
    let idx = 0;

    while (idx < data.length) {

      // we must have at least 1 byte for the size
      if (idx + 1 > data.length) break;

      const packetSize = data.readUInt8(idx);

      // sanity checks
      if (packetSize <= 0) {
        console.warn('Invalid packet size:', packetSize);
        break;
      }

      if (idx + packetSize > data.length) {
        // incomplete packet - wait for more data
        break;
      }

      // slice returns a view (no copy) — faster and less memory churn
      const extractedPacket = data.slice(idx, idx + packetSize);
      try {
        this.interpret(c, extractedPacket);
      } catch (err) {
        console.error('Error interpreting packet:', err);
        // don't crash server on malformed single-packet
      }
      idx += packetSize;
    }
  },

  interpret: function(c, datapacket) {

    // Parse the header command and normalize it (strip nulls and whitespace)
    let header = PacketModels.header.parse(datapacket);
    let command = header.command;
    if (typeof command === 'string') {
      command = command.replace(/\0/g, '').trim().toUpperCase();
    }

    switch (command) {

      case "LOGIN":
        {
          const data = PacketModels.login.parse(datapacket);
          User.login(data.username, data.password, function(result, user) {
            console.log('Login Result ' + result);
            if (result) {
              c.user = user;
              c.entergame(c.user.current_room, c.user.pos_x, c.user.pos_y);
              c.socket.write(packet.build(["LOGIN", "TRUE", c.user.current_room, c.user.pos_x, c.user.pos_y, c.user.username, c.user.userhp, c.user.usermp, c.user.userhplow, c.user.usermplow]));
              // add all other currently logged users
              c.broadcastroom(packet.build(["POS", c.user.username, c.user.pos_x, c.user.pos_y, c.user.current_room, c.user.userhp, c.user.userhplow]));
            } else {
              c.socket.write(packet.build(["LOGIN", "FALSE"]));
            }
          });
        }
        break;

      case "REGISTER":
        {
          const data = PacketModels.register.parse(datapacket);
          User.register(data.username, data.password, function(result) {
            if (result) {
              c.socket.write(packet.build(["REGISTER", "TRUE"]));
            } else {
              c.socket.write(packet.build(["REGISTER", "FALSE"]));
            }
          });
        }
        break;

      case "POS":
        {
          const data = PacketModels.pos.parse(datapacket);
          c.user.pos_x = data.target_x;
          c.user.pos_y = data.target_y;
          c.user.userhp = data.userhp;
          c.user.userhplow = data.userhplow;
          c.broadcastroom(packet.build(["POS", c.user.username, data.target_x, data.target_y, data.player_room, data.userhp, data.userhplow]));
        }
        break;

      case "POSM":
        {
          const data = PacketModels.posm.parse(datapacket);
          Mobs.save(data.currently_room, data.number, data.name, data.target_x, data.target_y, function(result, res) {
            if (result) {
              c.broadcastroom(packet.build(["POSM", data.target_x, data.target_y, data.name, data.number]));
            }
          });
        }
        break;

      case "ROOM":
        {
          const data = PacketModels.room.parse(datapacket);
          c.exitroom(c.user.current_room, data.player_room, data.target_x, data.target_y);
          c.user.pos_x = data.target_x;
          c.user.pos_y = data.target_y;
          c.user.current_room = data.player_room;
          c.user.save();
        }
        break;

      default:
        console.warn('Unknown command:', command);
        break;
    }
  }
};