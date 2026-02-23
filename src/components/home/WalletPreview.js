import {FlatList, Image, StyleSheet, View} from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Feather';

// custom import
import {getHeight, moderateScale} from '../../common/constants';
import {useSelector} from 'react-redux';
import {styles} from '../../themes';
import CText from '../common/CText';
import String from '../../i18n/String';

export default function WalletPreview(props) {
  const colors = useSelector(state => state.theme.theme);
  const {image, titleText, depositValue, transferValue, data} = props;

  const renderDetails = ({item, index}) => {
    return (
      <View key={index}>
        <View style={localStyle.titleAndValueContainer}>
          <CText type={'R14'} color={colors.grayScale500}>
            {item.title}
          </CText>
          {item.value === String.successful ? (
            <View
              style={[
                localStyle.successfulBg,
                {
                  backgroundColor: colors.green1,
                },
              ]}>
              <CText type={'M14'} color={colors.green}>
                {item.value}
              </CText>
            </View>
          ) : (
            <CText type={'M14'} color={colors.textColor}>
              {item.value}
            </CText>
          )}
        </View>
        <View
          style={[
            localStyle.lineView,
            {
              backgroundColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}
        />
      </View>
    );
  };

  return (
    <View
      style={[
        localStyle.mainViewContainer,
        {
          backgroundColor: colors.inputBackground,
        },
      ]}>
      <Image source={image} style={localStyle.imageStyle} />
      <CText
        type={'R12'}
        color={colors.grayScale500}
        align={'center'}
        style={styles.mt5}>
        {titleText}
      </CText>

      {!!depositValue ? (
        <View style={styles.rowCenter}>
          <Ionicons
            name={'plus'}
            size={moderateScale(18)}
            color={colors.textColor}
          />
          <CText type={'B18'} align={'center'}>
            {'$ ' + depositValue}
          </CText>
        </View>
      ) : (
        <CText type={'B18'} align={'center'}>
          {'$ ' + transferValue}
        </CText>
      )}
      <View style={localStyle.detailsContainer}>
        <FlatList
          data={data}
          renderItem={renderDetails}
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
    ...styles.mt30,
    ...styles.p20,
  },
  imageStyle: {
    ...styles.selfCenter,
    height: moderateScale(48),
    width: moderateScale(48),
    ...styles.mt20,
  },

  titleAndValueContainer: {
    ...styles.rowSpaceBetween,
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
