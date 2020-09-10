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
      averagePressure: {
        type: "float",
        id: 20
      },
      averageSeaLevelPressure: {
        type: "float",
        id: 21
      },
      precipitation: {
        type: "float",
        id: 22
      },
      oneHourMaxPrecipitation: {
        type: "float",
        id: 23
      },
      tenMinuteMaxPrecipitation: {
        type: "float",
        id: 24
      },
      averageTemperature: {
        type: "float",
        id: 25
      },
      highestTemperature: {
        type: "float",
        id: 26
      },
      lowestTemperature: {
        type: "float",
        id: 27
      },
      averageHumidity: {
        type: "float",
        id: 28
      },
      lowestHumidity: {
        type: "float",
        id: 29
      },
      averageWindSpeed: {
        type: "float",
        id: 30
      },
      maximumWindSpeed: {
        type: "float",
        id: 31
      },
      maximumWindDirection: {
        type: "string",
        id: 32
      },
      maximumGustSpeed: {
        type: "float",
        id: 33
      },
      maximumGustDirection: {
        type: "string",
        id: 34
      },
      daylightHours: {
        type: "float",
        id: 35
      },
      showFall: {
        type: "float",
        id: 36
      },
      showDepth: {
        type: "float",
        id: 37
      },
      dayWeatherDescription: {
        type: "string",
        id: 38
      },
      nightWeatherDescription: {
        type: "string",
        id: 39
      },
      date: {
        type: "int32",
        id: 40
      }
    }
  }
});

module.exports = $root;
