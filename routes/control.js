var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3').verbose();
var sys = require('util')
var exec = require('child_process');
var start_gateway = require('./start_gateway');

router.get('/', function(req, res, next) {
  var db = new sqlite3.Database('lora_gateway.db');

  var auto_start = false;

  db.serialize(function() {
    db.get("SELECT * FROM configs", [], (err, row) => {
        auto_start = row['auto_start'];
    });
  });
  db.close();

  var command = "service lora-gateway-bridge status | cat"
  var lora_gateway_bridge = start_gateway.run_status_command(command);

  var spi_command = "./lora_gateway/libloragw/test_loragw_spi";
  var spi = start_gateway.run_command(spi_command);

  var spi_value = spi.substring(
    spi.indexOf("(simple read): ") + 15,
    spi.indexOf("End of test"),
  ).replace(/\n/g, '');

  var registries_command = "./lora_gateway/libloragw/test_loragw_reg"
  var registries = start_gateway.run_command(registries_command).substring(
    start_gateway.run_command(registries_command).indexOf("End of register verification")
  );;

  var command = "service packet_forwarder status | cat"
  var status = start_gateway.run_status_command(command);

  setTimeout(function() {
    res.render('control', {auto_start: auto_start, lora_gateway_bridge_output: lora_gateway_bridge['output'], lora_gateway_bridge_status: lora_gateway_bridge['status'].charAt(0).toUpperCase() + lora_gateway_bridge['status'].slice(1), packet_forwarder_output: status['output'], packet_forwarder_status: status['status'].charAt(0).toUpperCase() + status['status'].slice(1), spi: spi, spi_value: spi_value, registries: registries});
  }, 100);
});


router.post('/packet_forwarder', function(req, res, next) {
  var action = req.body.action;

  if (action == 'start') {
    setTimeout(function() {
      start_gateway.run_command('sudo service packet_forwarder start');

      res.json({
        response: "Starting service!"
      });
    }, 200);
  }
  else if (action == 'stop') {
    setTimeout(function() {
      start_gateway.run_command('sudo service packet_forwarder stop');

      res.json({
        response: "Stoping service!"
      });
    }, 200);
  }
  else if (action == 'restart') {
    setTimeout(function() {
      start_gateway.run_command('sudo service packet_forwarder restart');

      res.json({
        response: "Restarting service"
      });
    }, 100);
  }
});

router.post('/lora_gateway_bridge', function(req, res, next) {
  var action = req.body.action;

  if (action == 'start') {
    setTimeout(function() {
      start_gateway.run_command('sudo service lora-gateway-bridge start');

      res.json({
        response: "Starting service!"
      });
    }, 200);
  }
  else if (action == 'stop') {
    setTimeout(function() {
      start_gateway.run_command('sudo service lora-gateway-bridge stop');

      res.json({
        response: "Stoping service!"
      });
    }, 200);
  }
  else if (action == 'restart') {
    setTimeout(function() {
      start_gateway.run_command('sudo service lora-gateway-bridge restart');

      res.json({
        response: "Restarting service"
      });
    }, 100);
  }
});

router.get('/lora_gateway_reset', function(req, res, next) {
  setTimeout(function() {
    start_gateway.run_command('./lora_gateway/reset_lgw.sh start 17');

    res.json({
      response: "Resetting the values!"
    });
  }, 200);
});

module.exports = router;
