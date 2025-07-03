import React from 'react';
import {View} from 'react-native';
import {
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryAxis,
} from 'victory-native';
import {moderateScale} from '../../../common/constants';
import {useSelector} from 'react-redux';
const GroupedBarGraph = props => {
  const colors = useSelector(state => state.theme.theme);

  const graphData = [
    {
      day: 'Sun',
      val2: Math.floor(Math.random() * 100) + 1,
      val1: Math.floor(Math.random() * 100) + 1,
      val3: Math.floor(Math.random() * 100) + 1,
    },
    {
      day: 'Mon',
      val2: Math.floor(Math.random() * 100) + 1,
      val1: Math.floor(Math.random() * 100) + 1,
      val3: Math.floor(Math.random() * 100) + 1,
    },
    {
      day: 'Tue',
      val2: Math.floor(Math.random() * 100) + 1,
      val1: Math.floor(Math.random() * 100) + 1,
      val3: Math.floor(Math.random() * 100) + 1,
    },
    {
      day: 'Wed',
      val2: Math.floor(Math.random() * 100) + 1,
      val1: Math.floor(Math.random() * 100) + 1,
      val3: Math.floor(Math.random() * 100) + 1,
    },
    {
      day: 'Thu',
      val2: Math.floor(Math.random() * 100) + 1,
      val1: Math.floor(Math.random() * 100) + 1,
      val3: Math.floor(Math.random() * 100) + 1,
    },
    {
      day: 'Fri',
      val2: Math.floor(Math.random() * 100) + 1,
      val1: Math.floor(Math.random() * 100) + 1,
      val3: Math.floor(Math.random() * 100) + 1,
    },
    {
      day: 'Sat',
      val2: Math.floor(Math.random() * 100) + 1,
      val1: Math.floor(Math.random() * 100) + 1,
      val3: Math.floor(Math.random() * 100) + 1,
    },
  ];

  return (
    <View>
      <VictoryChart
        domainPadding={moderateScale(25)}
        theme={{
          axis: {
            style: {
              tickLabels: {
                padding: moderateScale(10),
                fill: colors.dark ? colors.grayScale500 : colors.grayScale400,
              },
              grid: {stroke: colors.inputBackground, strokeWidth: 1},
            },
          },
        }}>
        <VictoryAxis
          tickValues={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
        />
        <VictoryAxis dependentAxis tickFormat={t => t.toFixed(0)} />
        {graphData.length > 0 && (
          <VictoryGroup offset={10} colorScale={'qualitative'}>
            <VictoryBar
              data={graphData}
              x="day"
              y="val1"
              style={{data: {fill: colors.primary}}}
              cornerRadius={{top: moderateScale(2)}}
              animate={{duration: 500, onLoad: {duration: 1000}}}
            />
            <VictoryBar
              data={graphData}
              x="day"
              y="val2"
              cornerRadius={{top: moderateScale(2)}}
              style={{data: {fill: colors.blue}}}
            />
            <VictoryBar
              data={graphData}
              x="day"
              y="val3"
              cornerRadius={{top: moderateScale(2)}}
              style={{data: {fill: colors.green}}}
            />
          </VictoryGroup>
        )}
      </VictoryChart>
    </View>
  );
};

export default GroupedBarGraph;
