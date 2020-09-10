/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
"use strict";

var $protobuf = require("protobufjs/light");

var $root = ($protobuf.roots["default"] || ($protobuf.roots["default"] = new $protobuf.Root()))
.addJSON({
  HistoryWeatherDataResponse: {
    fields: {
      blockId: {
        type: "int32",
        id: 16
      },
      location: {
        type: "string",
        id: 17
      },
      data: {
        rule: "repeated",
        type: "HistoryWeatherDataResponseItem",
        id: 18
      }
    }
  },
  HistoryWeatherDataResponseItem: {
    fields: {
      time: {
        type: "string",
        id: 19
      },
      measurements: {
        rule: "repeated",
        type: "Measurement",
        id: 20
      }
    }
  },
  Measurement: {
    fields: {
      field: {
        type: "string",
        id: 1
      },
      value: {
        type: "string",
        id: 2
      }
    }
  }
});

module.exports = $root;
