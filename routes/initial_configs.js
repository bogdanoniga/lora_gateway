var sqlite3 = require('sqlite3').verbose();
var os = require('os')
var fs = require('fs-extra');       //File System - for file manipulation
var sys = require('util')
var exec = require('child_process');
var start_gateway = require('./start_gateway');

// ADD initial configs
var db = new sqlite3.Database('lora_gateway.db');

var command = "GWID_MIDFIX=\"FFFE\"; GWID_BEGIN=$(ip link show eth0 | awk '/ether/ {print $2}' | awk -F\: '{print $1$2$3}'); GWID_END=$(ip link show eth0 | awk '/ether/ {print $2}' | awk -F\: '{print $4$5$6}'); echo $GWID_BEGIN$GWID_MIDFIX$GWID_END"

// Forwarder config
var gateway_id = exec.execSync(command).toString('utf8').replace('\n','');
var auto_start = false;
var server_address = 'localhost';
var serv_port_up = '1700';
var serv_port_down = '1700';

// LoRa Gateway Bridge config
var udp_bind = "127.0.0.1:1700";
var mqtt_address = 'tcp://127.0.0.1:1883';
var mqtt_status = '!connected';
var mqtt_tlscert = '';
var mqtt_tlskey = '';
var uplink_topic_template = "gateway/" + gateway_id + "/rx";
var downlink_topic_template = "gateway/" + gateway_id + "/tx";
var stats_topic_template = "gateway/" + gateway_id + "/stats";
var ack_topic_template = "gateway/" + gateway_id + "/ack";
var config_topic_template = "gateway/" + gateway_id + "/config";

db.serialize(function() {
  db.run("CREATE TABLE if not exists configs (gateway_id TEXT, auto_start BOOLEAN NOT NULL, server_address TEXT, serv_port_up TEXT, serv_port_down TEXT, udp_bind TEXT, mqtt_address TEXT, mqtt_status TEXT, mqtt_tlscert TEXT, mqtt_tlskey TEXT, uplink_topic_template TEXT, downlink_topic_template TEXT, stats_topic_template TEXT, ack_topic_template TEXT, config_topic_template TEXT)");

  var stmt = db.prepare("INSERT INTO configs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

  db.get("SELECT * FROM configs", [], (err, row) => {
    console.log(row);
      if(row == undefined) {
        stmt.run(gateway_id, auto_start, server_address, serv_port_up, serv_port_down, udp_bind, mqtt_address, mqtt_status, mqtt_tlscert, mqtt_tlskey, uplink_topic_template, downlink_topic_template, stats_topic_template, ack_topic_template, config_topic_template);
        stmt.finalize();
      }
      else {
        auto_start = row['auto_start'];
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
  result = result.replace(/uplink_topic_template=".*/g, 'uplink_topic_template="' + uplink_topic_template + '"');
  result = result.replace(/downlink_topic_template=".*/g, 'downlink_topic_template="' + downlink_topic_template + '"');
  result = result.replace(/stats_topic_template=".*/g, 'stats_topic_template="' + stats_topic_template + '"');
  result = result.replace(/ack_topic_template=".*/g, 'ack_topic_template="' + ack_topic_template + '"');
  result = result.replace(/config_topic_template=".*/g, 'config_topic_template="' + config_topic_template + '"');
  result = result.replace(/mac=".*/g, 'mac="' + gateway_id +'"');
  result = result.replace(/server=".*/g, 'server="' + mqtt_address + '"');
  result = result.replace(/tls_cert=".*/g, 'tls_cert="' + mqtt_tlscert + '"');
  result = result.replace(/tls_key=".*/g, 'tls_key="' + mqtt_tlskey + '"');

  fs.writeFile('/etc/lora-gateway-bridge/lora-gateway-bridge.toml', result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});

fs.readFile('./packet_forwarder/lora_pkt_fwd/global_conf.json', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/"gateway_ID":.*/g, '"gateway_ID": "'+ gateway_id +'",');
  result = result.replace(/"server_address":.*/g, '"server_address": "' + server_address +'",');
  result = result.replace(/"serv_port_up":.*/g, '"serv_port_up": ' + serv_port_up + ',');
  result = result.replace(/"serv_port_down":.*/g, '"serv_port_down": ' + serv_port_down + ',');

  fs.writeFile('./packet_forwarder/lora_pkt_fwd/global_conf.json', result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});

fs.readFile('./packet_forwarder/lora_pkt_fwd/local_conf.json', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/"gateway_ID":.*/g, '"gateway_ID": "'+ gateway_id +'"');

  fs.writeFile('./packet_forwarder/lora_pkt_fwd/local_conf.json', result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});

fs.mkdirs('./tls', function (err) {
  if (err) return console.error(err)
  console.log("success!")
});

setTimeout(function() {
  console.log(auto_start);
  if (auto_start) {
    console.log('ham');
  }
}, 500);

console.log("Initial configs added!");
// END ADD initial configs
