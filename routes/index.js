var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();

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
        mqtt_tlscert = row['mqtt_tlscert'];
        mqtt_tlskey = row['mqtt_tlskey'];
        uplink_topic_template = row['uplink_topic_template'];
        downlink_topic_template = row['downlink_topic_template'];
        stats_topic_template = row['stats_topic_template'];
        ack_topic_template = row['ack_topic_template'];
        config_topic_template = row['config_topic_template'];
    });
  });
  db.close();

  setTimeout(function() {
    res.render('index', {gateway_id: gateway_id, auto_start: auto_start, server_address: server_address, serv_port_up: serv_port_up, serv_port_down: serv_port_down, udp_bind: udp_bind, mqtt_address: mqtt_address, mqtt_status: mqtt_status, mqtt_tlscert: mqtt_tlscert, mqtt_tlskey: mqtt_tlskey, uplink_topic_template: uplink_topic_template, downlink_topic_template: downlink_topic_template, stats_topic_template: stats_topic_template, ack_topic_template: ack_topic_template, config_topic_template: config_topic_template});
  }, 100);
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
