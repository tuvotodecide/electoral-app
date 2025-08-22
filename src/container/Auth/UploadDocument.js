import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {useSelector} from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaViewAuth from '../../components/common/CSafeAreaViewAuth';
import CHeader from '../../components/common/CHeader';
import StepIndicator from '../../components/authComponents/StepIndicator';
import String from '../../i18n/String';
import CText from '../../components/common/CText';
import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import {UploadDocumentData} from '../../api/constant';
import CButton from '../../components/common/CButton';
import {AuthNav} from '../../navigation/NavigationKey';

export default function UploadDocument({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState('');

  const onPressSelect = item => {
    setIsSelect(item.id);
  };

  const onPressContinue = () => {
    navigation.navigate(AuthNav.UploadPhotoId);
  };

  const RenderUploadData = ({item, index}) => {
    return (
      <TouchableOpacity
        style={[
          localStyle.uploadTypeContainer,
          {
            borderColor:
              isSelect === item.id
                ? colors.primary
                : colors.dark
                ? colors.grayScale700
                : colors.grayScale60,
            backgroundColor: colors.dark
              ? colors.inputBackground
              : colors.grayScale60,
          },
        ]}
        onPress={() => onPressSelect(item)}>
        <View style={localStyle.uploadTypeInnerView}>
          <View style={localStyle.imageAndTextContainer}>
            <View
              style={[
                localStyle.imageContainer,
                {
                  backgroundColor:
                    isSelect === item.id
                      ? colors.primary
                      : colors.dark
                      ? colors.grayScale700
                      : colors.backgroundColor,
                },
              ]}>
              {isSelect === item.id ? item.isSelectIcon : item.notSelectIcon}
            </View>
            <CText
              type={'B16'}
              color={
                isSelect === item.id
                  ? colors?.dark
                    ? colors.primary
                    : colors.textColor
                  : colors.textColor
              }
              style={localStyle.documentText}>
              {item.name}
            </CText>
          </View>
          <Ionicons
            name={
              isSelect === item.id
                ? 'radio-button-on-outline'
                : 'radio-button-off-outline'
            }
            color={
              isSelect === item.id
                ? colors.primary
                : colors.dark
                ? colors.grayScale700
                : colors.grayScale200
            }
            size={moderateScale(24)}
            style={styles.mr10}
          />
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaViewAuth>
      <CHeader />
      <StepIndicator step={6} />
      <View style={localStyle.mainContainer}>
        <View>
          <CText type={'B24'} style={localStyle.headerTextStyle}>
            {String.selectUpload}
          </CText>
          <CText type={'R14'} color={colors.grayScale500}>
            {String.selectUploadDescription}
          </CText>
          <View
            style={[
              localStyle.uploadContainer,
              {
                backgroundColor: colors.dark
                  ? colors.inputBackground
                  : colors.backgroundColor,
              },
            ]}>
            <FlatList
              data={UploadDocumentData}
              renderItem={RenderUploadData}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item, index) => item.id}
              vertical
              bounces={false}
            />
          </View>
        </View>
        <CButton
          title={String.continue}
          onPress={onPressContinue}
          type={'B16'}
        />
      </View>
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.justifyBetween,
    ...styles.flex,
  },
  uploadContainer: {
    ...styles.mt30,
    ...styles.ph10,
    ...styles.pv10,
    borderRadius: moderateScale(10),
  },
  uploadTypeContainer: {
    height: moderateScale(64),
    borderRadius: moderateScale(12),
    ...styles.mv10,
    ...styles.p10,
    borderWidth: moderateScale(1),
    width: '100%',
    ...styles.selfCenter,
  },
  uploadTypeInnerView: {
    ...styles.rowSpaceBetween,
  },
  imageAndTextContainer: {
    ...styles.flexRow,
  },
  imageContainer: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.center,
  },
  documentText: {
    ...styles.ml10,
    ...styles.mt10,
  },
});
