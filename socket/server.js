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

let MAC_LED = null;
let MAC_PORTE = null;
let MAC_BR = "FFFFFFFFFFFFFFFF";
let MAC_CAPTEUR = null;

let prevPorteState = null;
let prevLedState = null;

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
});

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
    console.log(frame);

    if (frame.nodeIdentifier === "capteur"){
      MAC_CAPTEUR = frame.remote64;
      console.log("capteur MAC : ", MAC_CAPTEUR);
    } else if (frame.nodeIdentifier === "led"){
      MAC_LED = frame.remote64;
      console.log("capteur MAC : ", MAC_LED);
    } else if (frame.nodeIdentifier === "porte"){
      MAC_PORTE = frame.remote64;
      console.log("capteur MAC : ", MAC_PORTE);
    }
    //storage.registerSensor(frame.remote64)

  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {

    if (MAC_PORTE === null) return;
    if (MAC_CAPTEUR === null) return;
    if (MAC_LED === null) return;

    const ad0Value = frame.analogSamples.AD0;
    console.log(ad0Value);

    if (ad0Value > 1180) {
      console.log("Incendie + Lumière Rouge");
      // Mettre à jour l'état de la porte si nécessaire
      if (prevPorteState !== 5) {
        frame_obj = { // AT Request to be sent
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            destination64: MAC_PORTE,
            command: "D0",
            commandParameter: [ 5 ],
        };
        xbeeAPI.builder.write(frame_obj);
        prevPorteState = 5;
      }

      // Mettre à jour l'état de la lumière rouge si nécessaire
      if (prevLedState !== 5) {
        let frame_obj = {
          type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
          destination64: MAC_LED,
          command: "D0",
          commandParameter: [4],
        };
        xbeeAPI.builder.write(frame_obj);

        frame_obj = {
          type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
          destination64: MAC_LED,
          command: "D2",
          commandParameter: [5],
        };
        xbeeAPI.builder.write(frame_obj);

        prevLedState = 5;
      }
    } else if (ad0Value < 1181) {
      console.log("Libre Service + Lumière Bleu");
      // Mettre à jour l'état de la porte si nécessaire
      if (prevPorteState !== 4) {
        let frame_obj = {
          type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
          destination64: MAC_PORTE,
          command: "D0",
          commandParameter: [4],
        };
        xbeeAPI.builder.write(frame_obj);
        prevPorteState = 4;
      }

      // Mettre à jour l'état de la lumière rouge si nécessaire
      if (prevLedState !== 4) {
        let frame_obj = {
          type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
          destination64: MAC_LED,
          command: "D0",
          commandParameter: [5],
        };
        xbeeAPI.builder.write(frame_obj);

        frame_obj = {
          type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
          destination64: MAC_LED,
          command: "D2",
          commandParameter: [4],
        };
        xbeeAPI.builder.write(frame_obj);

        prevLedState = 4;
      }
    } else {
      console.log("MAC a générer");
    }

  } else if (C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE === frame.type) {
    // console log la frame
    /*console.log("Log de la frame :");
    console.log(frame);
    if (frame.command === "DO") {
          console.log("DO Identifier:", frame.commandData.toString());
    }
    if (frame.command === "D1") {
          console.log("D1 Identifier:", frame.commandData.toString());
    }
    if (frame.command === "D2") {
          console.log("D2 Identifier:", frame.commandData.toString());
    }*/


    //console.log("REMOTE_COMMAND_RESPONSE")
  } else {
    console.debug(frame);
    let dataReceived = String.fromCharCode.apply(null, frame.commandData)
    console.log(dataReceived);
  }

});
