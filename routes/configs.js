var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var busboy = require('connect-busboy'); //middleware for form/file upload
var fs = require('fs-extra');       //File System - for file manipulation
var path = require('path');

router.get('/', function(req, res, next) {
  var db = new sqlite3.Database('lora_gateway.db');

  var gateway_id = '';
  var auto_start = false;
  var server_address = '';
  var serv_port_up = '';
  var serv_port_down = '';
  var udp_bind = '';
  var mqtt_address = '';
  var mqtt_status = '';
  var mqtt_tlscert = '';
  var mqtt_tlskey = '';
  var uplink_topic_template = '';
  var downlink_topic_template = '';
  var stats_topic_template = '';
  var ack_topic_template = '';
  var config_topic_template = '';

  db.serialize(function() {
    db.get("SELECT * FROM configs", [], (err, row) => {
        gateway_id = row['gateway_id'];
        auto_start = row['auto_start'];
        server_address = row['server_address'];
        serv_port_up = row['serv_port_up'];
        serv_port_down = row['serv_port_down'];
        udp_bind = row['udp_bind'];
        mqtt_address = row['mqtt_address'];
        mqtt_status = row['mqtt_status'];
        mqtt_tlscert = row['mqtt_tlscert'].split('/').pop();
        mqtt_tlskey = row['mqtt_tlskey'].split('/').pop();
        uplink_topic_template = row['uplink_topic_template'];
        downlink_topic_template = row['downlink_topic_template'];
        stats_topic_template = row['stats_topic_template'];
        ack_topic_template = row['ack_topic_template'];
        config_topic_template = row['config_topic_template'];
    });
  });
  db.close();

  setTimeout(function() {
    res.render('configs', {gateway_id: gateway_id, auto_start:auto_start, server_address: server_address, serv_port_up: serv_port_up, serv_port_down: serv_port_down, udp_bind: udp_bind, mqtt_address: mqtt_address, mqtt_status: mqtt_status, mqtt_tlscert: mqtt_tlscert, mqtt_tlskey: mqtt_tlskey, uplink_topic_template: uplink_topic_template, downlink_topic_template: downlink_topic_template, stats_topic_template: stats_topic_template, ack_topic_template: ack_topic_template, config_topic_template: config_topic_template});
  }, 100);
});

router.post('/save', function(req, res, next) {
  var db = new sqlite3.Database('lora_gateway.db');

  var gateway_id = req.body.gateway_id;
  var server_address = req.body.server_address;
  var serv_port_up = req.body.serv_port_up;
  var serv_port_down = req.body.serv_port_down;
  var udp_bind = req.body.udp_bind;
  var mqtt_address = req.body.mqtt_address;
  var uplink_topic_template = req.body.uplink_topic_template;
  var downlink_topic_template = req.body.downlink_topic_template;
  var stats_topic_template = req.body.stats_topic_template;
  var ack_topic_template = req.body.ack_topic_template;
  var config_topic_template = req.body.config_topic_template;

  if (gateway_id == '' || server_address == '' || serv_port_up == '' || serv_port_down == '' || udp_bind == '' || mqtt_address == '' || uplink_topic_template == '' || downlink_topic_template == '' || stats_topic_template == '' || ack_topic_template == '' || config_topic_template == ''
  ) {
    res.json({message:'Empty fields not allowed!'});
  }
  else {
    db.serialize(function() {

      var stmt = db.prepare("UPDATE configs SET gateway_id = ?, server_address = ?, serv_port_up = ?, serv_port_down = ?, udp_bind = ?, mqtt_address = ?, uplink_topic_template = ?, downlink_topic_template = ?, stats_topic_template = ?, ack_topic_template = ?, config_topic_template = ? WHERE gateway_id = ?");

      db.get("SELECT * FROM configs", [], (err, row) => {
          if(row != undefined) {
            stmt.run(gateway_id, server_address, serv_port_up, serv_port_down, udp_bind, mqtt_address, uplink_topic_template, downlink_topic_template, stats_topic_template, ack_topic_template, config_topic_template, row['gateway_id']);
            console.log('MQTT information updated!');
            stmt.finalize();
          }
          else {
            stmt.finalize();
          }
      });
    });
    db.close();

    fs.readFile('/etc/lora-gateway-bridge/lora-gateway-bridge.toml', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
      var result = data.replace(/udp_bind = ".*/g, 'udp_bind = "'+ udp_bind +'"');
      result = result.replace(/mac=".*/g, 'mac="' + gateway_id +'"');
      result = result.replace(/uplink_topic_template="".*/g, 'uplink_topic_template="' + uplink_topic_template + '"');
      result = result.replace(/downlink_topic_template=".*/g, 'downlink_topic_template="' + downlink_topic_template + '"');
      result = result.replace(/stats_topic_template=".*/g, 'stats_topic_template="' + stats_topic_template + '"');
      result = result.replace(/ack_topic_template=".*/g, 'ack_topic_template="' + ack_topic_template + '"');
      result = result.replace(/config_topic_template=".*/g, 'config_topic_template="' + config_topic_template + '"');
      result = result.replace(/mac=".*/g, 'mac="' + gateway_id +'"');
      result = result.replace(/server=".*/g, 'server="' + mqtt_address + '"');

      fs.writeFile('/etc/lora-gateway-bridge/lora-gateway-bridge.toml', result, 'utf8', function (err) {
         if (err) return console.log(err);
      });
    });

    res.redirect('back');
  }

});

router.post('/tlscert', function(req, res, next) {
    // TODO: solve empty file upload

    req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      var saveTo = path.join('./tls', filename);
      console.log('Uploading: ' + saveTo);
      file.pipe(fs.createWriteStream(saveTo));

      absolute_save = process.env.PWD + '/tls/' + filename;

      var db = new sqlite3.Database('lora_gateway.db');

      db.serialize(function() {
        var stmt = db.prepare("UPDATE configs SET mqtt_tlscert = ? WHERE gateway_id = ?");

        db.get("SELECT * FROM configs", [], (err, row) => {
            if(row != undefined) {
              stmt.run(absolute_save, row['gateway_id']);
              stmt.finalize();
            }
            else {
              stmt.finalize();
            }
        });
      });
      db.close();
    });

    fs.readFile('/etc/lora-gateway-bridge/lora-gateway-bridge.toml', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }

      var result = data.replace(/tls_cert=".*/g, 'tls_cert="' + absolute_save + '"');

      fs.writeFile('/etc/lora-gateway-bridge/lora-gateway-bridge.toml', result, 'utf8', function (err) {
         if (err) return console.log(err);
      });
    });

    req.busboy.on('finish', function() {
      console.log('Upload complete');
      res.redirect('back');
    });
    return req.pipe(req.busboy);
});

router.post('/tlskey', function(req, res, next) {
    // TODO: solve empty file upload

    req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      var saveTo = path.join('./tls', filename);
      console.log('Uploading: ' + saveTo);
      file.pipe(fs.createWriteStream(saveTo));

      absolute_save = process.env.PWD + '/tls/' + filename;

      var db = new sqlite3.Database('lora_gateway.db');

      db.serialize(function() {
        var stmt = db.prepare("UPDATE configs SET mqtt_tlskey = ? WHERE gateway_id = ?");

        db.get("SELECT * FROM configs", [], (err, row) => {
            if(row != undefined) {
              stmt.run(absolute_save, row['gateway_id']);
              stmt.finalize();
            }
            else {
              stmt.finalize();
            }
        });
      });
      db.close();
    });

    fs.readFile('/etc/lora-gateway-bridge/lora-gateway-bridge.toml', 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }

      var result = data.replace(/tls_key=".*/g, 'tls_key="' + absolute_save + '"');

      fs.writeFile('/etc/lora-gateway-bridge/lora-gateway-bridge.toml', result, 'utf8', function (err) {
         if (err) return console.log(err);
      });
    });

    req.busboy.on('finish', function() {
      console.log('Upload complete');
      res.redirect('back');
    });
    return req.pipe(req.busboy);
});

router.get('/tls_cert_delete', function(req, res, next) {
  var db = new sqlite3.Database('lora_gateway.db');

  var file = '';

  db.serialize(function() {
    var stmt = db.prepare("UPDATE configs SET mqtt_tlscert = ? WHERE gateway_id = ?");

    db.get("SELECT * FROM configs", [], (err, row) => {

        if(row != undefined) {
          file = row['mqtt_tlscert'];
          stmt.run('', row['gateway_id']);
          stmt.finalize();
        }
        else {
          stmt.finalize();
        }
    });
  });
  db.close();

  setTimeout(function() {
    fs.stat(file, function (err, stats) {
       console.log(stats);//here we got all information of file in stats variable

       if (err) {
           return console.error(err);
       }

       fs.unlink(file,function(err){
            if(err) return console.log(err);
            console.log('file deleted successfully');
       });
    });
  }, 1000);

  res.end('file deleted successfully');
});

router.get('/tls_key_delete', function(req, res, next) {
  var db = new sqlite3.Database('lora_gateway.db');
  var file = '';

  db.serialize(function() {
    var stmt = db.prepare("UPDATE configs SET mqtt_tlskey = ? WHERE gateway_id = ?");

    db.get("SELECT * FROM configs", [], (err, row) => {

        if(row != undefined) {
          file = row['mqtt_tlskey'];
          stmt.run('', row['gateway_id']);
          stmt.finalize();
        }
        else {
          stmt.finalize();
        }
    });
  });
  db.close();

  setTimeout(function() {
    fs.stat(file, function (err, stats) {
       console.log(stats);//here we got all information of file in stats variable

       if (err) {
           return console.error(err);
       }

       fs.unlink(file,function(err){
            if(err) return console.log(err);
            console.log('file deleted successfully');
       });
    });
  }, 1000);

  res.end('file deleted successfully');
});

router.post('/auto', function(req, res, next) {
  var auto_start = req.body.auto_start;

  var db = new sqlite3.Database('lora_gateway.db');

  db.serialize(function() {
    if (auto_start != undefined) {
      var upt = db.prepare("UPDATE configs SET auto_start = ? WHERE auto_start = ?");
      if (auto_start == 'true') {
        upt.run(true, false);
      } else if (auto_start == 'false') {
        upt.run(false, true);
      }
      upt.finalize();
    }
  });

  db.close();

  setTimeout(function() {
    res.json({
      response: "ok"
    });
  }, 1000);
});

module.exports = router;
