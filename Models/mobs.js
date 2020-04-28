var mongoose = require ('mongoose');

var mobSchema = new mongoose.Schema({

    mobnumber: Number,
    mobname: String,
    mobhp : Number,
    mobroom: String,
    pos_x : Number,
    pos_y : Number,
    mobstatus : String

});

mobSchema.statics.register = function(mobnumber, mobname, hp, room, pos_x, pos_y, cb){

    var new_rat = new Mobs({
        mobnumber: mobnumber,
        mobname: mobname,
        mobhp: hp,
        mobroom: room,
        pos_x: pos_x,
        pos_y: pos_y,
        mobstatus: 'A'
    });

    new_rat.save(function(err){
        if(!err){
            cb(true);
        }else{
            cb(false);
        }
    })
};

mobSchema.statics.login = function(selected_room,number,name, cb) {
    Mobs.findOne({mobroom: selected_room, mobnumber: number, mobname: name},  function (err, result) {
        if (err) throw err;
        cb(true, result);
    });
};

mobSchema.statics.save = function(currently_room, number, name, target_x, target_y, cb) {
    Mobs.updateOne({mobroom: currently_room, mobnumber: number, mobname: name}, {$set: {pos_x: target_x, pos_y: target_y}}, function (err, res) {
        if (err) throw err;
        cb(true,res);
    });
}


module.exports = Mobs = gamedb.model('Mobs', mobSchema);