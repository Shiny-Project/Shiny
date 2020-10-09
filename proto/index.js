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
        type: "double",
        id: 20
      },
      averageSeaLevelPressure: {
        type: "double",
        id: 21
      },
      precipitation: {
        type: "double",
        id: 22
      },
      oneHourMaxPrecipitation: {
        type: "double",
        id: 23
      },
      tenMinuteMaxPrecipitation: {
        type: "double",
        id: 24
      },
      averageTemperature: {
        type: "double",
        id: 25
      },
      highestTemperature: {
        type: "double",
        id: 26
      },
      lowestTemperature: {
        type: "double",
        id: 27
      },
      averageHumidity: {
        type: "double",
        id: 28
      },
      lowestHumidity: {
        type: "double",
        id: 29
      },
      averageWindSpeed: {
        type: "double",
        id: 30
      },
      maximumWindSpeed: {
        type: "double",
        id: 31
      },
      maximumWindDirection: {
        type: "string",
        id: 32
      },
      maximumGustSpeed: {
        type: "double",
        id: 33
      },
      maximumGustDirection: {
        type: "string",
        id: 34
      },
      daylightHours: {
        type: "double",
        id: 35
      },
      showFall: {
        type: "double",
        id: 36
      },
      showDepth: {
        type: "double",
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
