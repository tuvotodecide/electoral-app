import {FlatList, Image, StyleSheet, View} from 'react-native';
import React, { useRef } from 'react';

// custom import
import {moderateScale} from '../../common/constants';
import {useSelector} from 'react-redux';
import {styles} from '../../themes';
import CListCard from '../common/CLIstCard';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';

export default function QRDetails({qrData, data, getRef}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <View
      style={[
        localStyle.mainViewContainer,
        {
          backgroundColor: colors.inputBackground,
        },
      ]}>
      <View style={localStyle.imageStyle}>
        <QRCode
          value={qrData}
          size={moderateScale(200)}
          getRef={getRef}
        />
      </View>
      <View style={localStyle.detailsContainer}>
        <FlatList
          data={data}
          renderItem={({item, index}) => <CListCard item={item} index={index} size='small' />}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    </View>
  );
}

const localStyle = StyleSheet.create({
  mainViewContainer: {
    width: '90%',
    borderRadius: moderateScale(12),
    ...styles.selfCenter,
    ...styles.mt10,
    ...styles.p20,
  },
  imageStyle: {
    backgroundColor: 'white',
    ...styles.selfCenter,
    width: moderateScale(220),
    height: moderateScale(220),
    ...styles.p10,
  },
  titleAndValueContainer: {
    ...styles.rowSpaceBetween,
  },
	titleAndIconContainer: {
		...styles.rowStart,
		gap: 10,
	},
  lineView: {
    width: '100%',
    height: moderateScale(1),
    ...styles.mv15,
  },
  detailsContainer: {
    ...styles.mt20,
  },
  successfulBg: {
    height: moderateScale(24),
    ...styles.ph10,
    ...styles.center,
    borderRadius: moderateScale(6),
  },
});