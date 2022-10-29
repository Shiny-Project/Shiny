module.exports = {
    parse: async (event) => {
        const axios = require("axios");
        const number = event.data.typhoon_data?.current?.number;

        if (!number) {
            return [
                {
                    text: event.data.content,
                },
            ];
        }

        const data = await DataTimeSeries.find({
            key: `jma_typhoon_${number}`,
        }).sort("id desc");

        const current = data[0];
        const currentTyphoonRecordId = current.id;
        const parseCoordinate = (coordinateStr) => {
            if (!coordinateStr) {
                return;
            }
            const [_, operator1, coordinate1, operator2, coordinate2] = coordinateStr.match(
                /^([+-])([0-9.]+)([+-])([0-9.]+)\/*$/
            );
            return [parseFloat(`${operator2}${coordinate2}`), parseFloat(`${operator1}${coordinate1}`)];
        };
        const parseIntensity = (item) => {
            const typhoonClass = item.typhoon_class;
            const intensityClass = item.intensity_class;
            if (typhoonClass === "台風（TY）" || typhoonClass === "台風(TY)") {
                if (intensityClass === "猛烈な") {
                    return 5;
                } else if (intensityClass === "非常に強い") {
                    return 4;
                }
                return 3;
            } else if (typhoonClass === "台風（STS）" || typhoonClass === "台風(STS)") {
                return 2;
            }
            return 1;
        };
        const parseAreas = (area) => {
            const result = [];
            if (!area.wide_side.radius) {
                return result;
            }
            if (area.wide_side.direction === "全域" || area.wide_side.direction === "") {
                result.push({
                    radius: parseInt(area.wide_side.radius) * 1000,
                    direction: 1,
                });
                return result;
            }
            const DirectionMap = {
                北: 2,
                北東: 3,
                東: 4,
                東南: 5,
                南: 6,
                西南: 7,
                西: 8,
                北西: 9,
            };
            if (DirectionMap[area.wide_side.direction]) {
                result.push({
                    radius: parseInt(area.wide_side.radius) * 1000,
                    direction: DirectionMap[area.wide_side.direction],
                });
            }
            if (DirectionMap[area.narrow_side.direction]) {
                result.push({
                    radius: parseInt(area.narrow_side.radius) * 1000,
                    direction: DirectionMap[area.narrow_side.direction],
                });
            }
            return result;
        };
        const convertCircles = (item) => {
            const result = [];
            if (item.strong_wind_area) {
                result.push(...parseAreas(item.strong_wind_area).map((i) => ({ ...i, type: 1 })));
            }
            if (item.storm_wind_area) {
                result.push(...parseAreas(item.storm_wind_area).map((i) => ({ ...i, type: 2 })));
            }
            return result;
        };
        const currentData = JSON.parse(current.data);

        const StatusRemarkMap = {
            2: "台风移出管辖区域",
            3: "台风减弱为热带低压",
            4: "台风变性为温带气旋",
            6: "台风命名",
        };

        if (currentData.current.status !== 1) {
            if (StatusRemarkMap[currentData.current.status]) {
                const response = await axios.post("http://localhost:3000/Map/typhoon_info", {
                    typhoon_info: JSON.stringify({
                        remark: StatusRemarkMap[currentData.current.status],
                    }),
                });
                return [
                    {
                        text: CommonUtils.replaceCensorshipWords(event.data.content),
                        pic: response.data.path,
                    },
                ];
            }
            return [
                {
                    text: CommonUtils.replaceCensorshipWords(event.data.content),
                },
            ];
        }

        const result = data.reverse().map((item, index) => {
            const { createdAt: itemTime, id, data } = item;
            const type = id === currentTyphoonRecordId ? 2 : 1;
            const itemData = JSON.parse(data);
            const parsedCoordinate = parseCoordinate(itemData.current.coordinate);
            const intensity = parseIntensity(itemData.current);
            return {
                type,
                coordinate: parsedCoordinate,
                intensity,
                ...(type === 2
                    ? {
                          circles: convertCircles(itemData.current),
                      }
                    : {}),
            };
        });
        if (currentData.estimations?.length) {
            result.push(
                ...currentData.estimations.map((item) => {
                    const coordinate = parseCoordinate(item.coordinate || item.probability_circle?.base_point);
                    const intensity = parseIntensity(item);
                    return {
                        type: 3,
                        coordinate,
                        intensity,
                    };
                })
            );
        }

        const response = await axios.post("http://localhost:3000/Map/typhoon_info", {
            typhoon_info: JSON.stringify({
                points: result,
            }),
        });

        return [
            {
                text: CommonUtils.replaceCensorshipWords(event.data.content),
                pic: response.data.path,
            },
        ];
    },
};
