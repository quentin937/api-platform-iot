var SerialPort = require('serialport');
var xbee_api = require('xbee-api');
var C = xbee_api.constants;
//var storage = require("./storage")
require('dotenv').config()


const SERIAL_PORT = process.env.SERIAL_PORT;
console.log(SERIAL_PORT)
var xbeeAPI = new xbee_api.XBeeAPI({
  api_mode: 2
});

let serialport = new SerialPort(SERIAL_PORT, {
  baudRate:  9600,
}, function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
});

serialport.pipe(xbeeAPI.parser);
xbeeAPI.builder.pipe(serialport);

var clr_R = 5;
var clr_G = 5;
var clr_B = 5;

const MAC_LED = "0013A20041FB6072";
const MAC_PORTE = "";
const MAC_BR = "FFFFFFFFFFFFFFFF";
const MAC_Detect_Lumiere = "";

serialport.on("open", function () {
  var frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.AT_COMMAND,
    command: "NI",
    commandParameter: [],
  };
  xbeeAPI.builder.write(frame_obj);

  frame_obj = { // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: MAC_BR,
    command: "NI",
    commandParameter: [],
  };
  xbeeAPI.builder.write(frame_obj);

  etat_led_R = { // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: MAC_LED,
    command: "DO",
    commandParameter: [],
  };
  xbeeAPI.builder.write(etat_led_R);

  etat_led_G = { // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: MAC_LED,
    command: "D1",
    commandParameter: [],
  };
  xbeeAPI.builder.write(etat_led_G);

  etat_led_B = { // AT Request to be sent
    type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
    destination64: MAC_LED,
    command: "D2",
    commandParameter: [],
  };
  xbeeAPI.builder.write(etat_led_B);

});

// All frames parsed by the XBee will be emitted here

// storage.listSensors().then((sensors) => sensors.forEach((sensor) => console.log(sensor.data())))

xbeeAPI.parser.on("data", function (frame) {

  //on new device is joined, register it

  //on packet received, dispatch event
  //let dataReceived = String.fromCharCode.apply(null, frame.data);
  if (C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET === frame.type) {
    console.log("C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET");
    let dataReceived = String.fromCharCode.apply(null, frame.data);
    console.log(">> ZIGBEE_RECEIVE_PACKET >", dataReceived);

  }

  if (C.FRAME_TYPE.NODE_IDENTIFICATION === frame.type) {
    // let dataReceived = String.fromCharCode.apply(null, frame.nodeIdentifier);
    console.log("NODE_IDENTIFICATION");
    //storage.registerSensor(frame.remote64)

  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {

      if (frame.analogSamples.AD0 <= 1090) {
          console.log("La lumière bleu s'allume")

          frame_obj = { // AT Request to be sent
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            destination64: MAC_LED,
            command: "D0",
            commandParameter: [ 4 ],
          };

          xbeeAPI.builder.write(frame_obj);
      } else if (frame.analogSamples.AD0 <= 1090) {

      }

        console.log("ZIGBEE_IO_DATA_SAMPLE_RX")
        console.log(frame.analogSamples.AD0)

        //storage.registerSample(frame.remote64,frame.analogSamples.AD0 )

  } else if (C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE === frame.type) {
      // console log la frame
      console.log("Log de la frame :", frame);
    if (frame.command === "DO") {
          console.log("DO Identifier:", frame.commandData.toString());
    } else if (frame.command === "D1") {
          console.log("DO Identifier:", frame.commandData.toString());
    } else if (frame.command === "D2") {
          console.log("DO Identifier:", frame.commandData.toString());
    }
    console.log("REMOTE_COMMAND_RESPONSE")
  } else {
    console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.log(dataReceived);
  }

});
