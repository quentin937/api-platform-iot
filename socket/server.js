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

let MAC_LED = "";
//let MAC_LED = "0013A20041FB6072";
let MAC_PORTE = "";
//let MAC_PORTE = "0013A20041FB6063";
let MAC_BR = "FFFFFFFFFFFFFFFF";
let MAC_CAPTEUR = "";
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
    let prevPorteState = null;
    let prevLedState = null;

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
    } else if (frame.nodeIdentifier === "led"){
      MAC_LED = frame.remote64;
    } else if (frame.nodeIdentifier === "porte"){
      MAC_PORTE = frame.remote64;
    }
    //storage.registerSensor(frame.remote64)

  } else if (C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX === frame.type) {
/*
      if (frame.analogSamples.AD0 > 1100   ) {
        console.log("Incendie + Lumière Rouge")

          // porte
          frame_obj = { // AT Request to be sent
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            destination64: MAC_PORTE,
            command: "D0",
            commandParameter: [ 5 ],
          };

          xbeeAPI.builder.write(frame_obj);

          // lumiere rouge
          frame_obj = { // AT Request to be sent
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            destination64: MAC_LED,
            command: "D0",
            commandParameter: [ 4 ],
          };

          xbeeAPI.builder.write(frame_obj);

          frame_obj = { // AT Request to be sent
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            destination64: MAC_LED,
            command: "D2",
            commandParameter: [ 5 ],
          };

          xbeeAPI.builder.write(frame_obj);
      } else {
        console.log("Libre Service + Lumière Bleu")

          // porte
          frame_obj = { // AT Request to be sent
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            destination64: MAC_PORTE,
            command: "D0",
            commandParameter: [ 4 ],
          };
        xbeeAPI.builder.write(frame_obj);

        // lumiere rouge
          frame_obj = { // AT Request to be sent
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            destination64: MAC_LED,
            command: "D0",
            commandParameter: [ 5 ],
          };

          xbeeAPI.builder.write(frame_obj);

          frame_obj = { // AT Request to be sent
            type: C.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
            destination64: MAC_LED,
            command: "D2",
            commandParameter: [ 4 ],
          };

          xbeeAPI.builder.write(frame_obj);
      }
      console.log(frame.analogSamples.AD0)
*/
        //storage.registerSample(frame.remote64,frame.analogSamples.AD0 )
    const ad0Value = frame.analogSamples.AD0;
    console.log(ad0Value);

    if (ad0Value > 1100) {
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
    } else if (ad0Value < 1101) {
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
