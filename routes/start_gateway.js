// TODO: autostart
// TODO: solve empty files upload
// TODO: remove autostart from home page, or we can remove home page?
// TODO: spi start, stop
// TODO: reboot

var sys = require('util')
var exec = require('child_process');

function exec_command(command) {
  var output = exec.execSync(command).toString('utf8');
  return output;
}

module.exports.run_command = function (command) {
    return exec_command(command);
};

module.exports.run_status_command = function (command) {
  var output = exec.execSync(command).toString('utf8');
  // ## echo "[*] Test lora_gateway"
  // # ./lora_gateway/libloragw/test_loragw_spi
  // # if value 48, spi works
  var active = output.split('\n')[2].replace(/ /g,'');
  var status = active.substring(
    active.indexOf("Active:") + 7,
    active.indexOf("(")
  );

  return {"output": output, "status": status, "active": active}
};
