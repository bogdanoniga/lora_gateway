$(document).ready(function() {

    $('[id^="gateway_"]').click(function(){
        var gateway_action = $(this).attr('id');
        console.log(gateway_action);
        var jsonObj = {};
        jsonObj['action'] = gateway_action.split('_').pop();

        $.ajax({
            type: 'POST',
            dataType: "json",
            data: jsonObj,
            url: 'control/packet_forwarder',
            success: function(response) {
              setTimeout(function()
              {
                location.reload(true);
              }, 2000);
            }
        });
    });

    $('[id^="lora_gateway_bridge_"]').click(function(){
        var gateway_action = $(this).attr('id');
        console.log(gateway_action);
        var jsonObj = {};
        jsonObj['action'] = gateway_action.split('_').pop();

        $.ajax({
            type: 'POST',
            dataType: "json",
            data: jsonObj,
            url: 'control/lora_gateway_bridge',
            success: function(response) {
              setTimeout(function()
              {
                location.reload(true);
              }, 2000);
            }
        });
    });

    $('#lora_gateway_reset').click(function(){
        $.ajax({
            type: 'GET',
            dataType: "json",
            url: 'control/lora_gateway_reset',
            success: function(response) {
              setTimeout(function()
              {
                location.reload(true);
              }, 2000);
            }
        });
    });

    $('[id^="tls_"][id$="_delete"]').click(function(){
        var delete_tls = $(this).attr('id');

        $.ajax({
            type: 'GET',
            dataType: "json",
            url: 'configs/' + delete_tls,
            success: function(response) {
              setTimeout(function()
              {
                console.log('aaa');
                location.reload(true);
              }, 1000);
            }
        });
    });

    $(".switch .slider").click(function(){
        var auto_id = $(this).parent().parent().attr('id');
        var auto_status = $(this).parent().children()[0].checked;

        var jsonObj = {};
        jsonObj[auto_id] = !auto_status

        $.ajax({
            type: 'POST',
            dataType: "json",
            data: jsonObj,
            url: 'configs/auto',
            success: function(response) {
                console.log(response);
            }
        });
    });

});
