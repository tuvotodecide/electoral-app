import {
  StyleSheet,
  TouchableOpacity,
  View,
  ImageBackground,
  FlatList,
  ScrollView,
  Image,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/Entypo';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {getHeight, moderateScale} from '../../../../common/constants';
import {useSelector} from 'react-redux';
import {styles} from '../../../../themes';
import CText from '../../../../components/common/CText';
import {ErethrunIcon} from '../../../../assets/svg';
import {historyOfBidData} from '../../../../api/constant';
import CButton from '../../../../components/common/CButton';

export default function PlaceBid({route}) {
  let item = route?.params?.item;
  const colors = useSelector(state => state.theme.theme);
  const [currentDate, setCurrentDate] = useState('');
  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <Ionicons
          name={'ellipsis-vertical'}
          color={colors.white}
          size={moderateScale(24)}
        />
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    var day = new Date().getDay();
    var hrs = new Date().getHours();
    var min = new Date().getMinutes();
    var second = new Date().getSeconds();
    setCurrentDate(
      day + 'd' + ' : ' + hrs + 'h' + ' : ' + min + 'm' + ' : ' + second + 's',
    );
  });

  const history = ({item, index}) => {
    return (
      <View style={localStyle.mainContainer}>
        <View
          style={[
            localStyle.historyContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <View style={localStyle.imageAndUserName}>
            <Image source={item.image} style={localStyle.userImage} />
            <View style={styles.ml10}>
              <CText type={'B14'}>{item.userName}</CText>
              <CText type={'R12'} color={colors.grayScale500}>
                {item.expiration}
              </CText>
            </View>
          </View>
          <CText type={'B14'}>{item.ethValue}</CText>
        </View>
      </View>
    );
  };

  const ListHeaderComponent = () => {
    return (
      <View style={localStyle.mainContainer}>
        <View
          style={[
            localStyle.bidImageContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <ImageBackground
            source={item.image}
            style={localStyle.bidImage}
            imageStyle={{borderRadius: moderateScale(12)}}>
            <View
              style={[
                localStyle.innerImageView,
                {
                  backgroundColor: colors.transparent,
                },
              ]}>
              <CText style={'M14'}>{String.endsIn}</CText>
              <CText type={'B14'}>{currentDate}</CText>
            </View>
          </ImageBackground>
        </View>
        <View style={localStyle.titleAndIcon}>
          <CText type={'B12'} color={colors.grayScale500} style={styles.mr5}>
            {item.title}
          </CText>
          {item.svgIcon}
        </View>
        <CText type={'B20'}>{item.name}</CText>

        <CText
          type={'R12'}
          color={colors.grayScale500}
          style={localStyle.placeBidDescription}>
          {String.placeBidText}
          <TouchableOpacity style={localStyle.readMoreText}>
            <CText type={'R12'} color={colors.primary} style={styles.ml5}>
              {String.readMore}
            </CText>
          </TouchableOpacity>
        </CText>
        <View
          style={[
            localStyle.increaseAndDecreaseContainer,
            {
              backgroundColor: colors.inputBackground,
            },
          ]}>
          <TouchableOpacity
            style={[
              localStyle.decreaseContainer,
              {
                backgroundColor: colors.dark
                  ? colors.grayScale700
                  : colors.backgroundColor,
              },
            ]}>
            <Icons
              name={'minus'}
              size={moderateScale(16)}
              color={colors.grayScale600}
            />
          </TouchableOpacity>
          <View style={localStyle.imageAndTextContainer}>
            <View
              style={[
                localStyle.imageAndText,
                {
                  backgroundColor: colors.bgColor,
                },
              ]}>
              <ErethrunIcon />
            </View>
            <CText type={'B16'} style={styles.ml10}>
              {'0.500 ETH'}
            </CText>
          </View>
          <TouchableOpacity
            style={[
              localStyle.decreaseContainer,
              {
                backgroundColor: colors.primary,
              },
            ]}>
            <Icons
              name={'plus'}
              size={moderateScale(16)}
              color={colors.white}
            />
          </TouchableOpacity>
        </View>
        <CText type={'B16'} style={styles.mt20}>
ç          {String.historyOfBid}
        </CText>
      </View>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.placeBid} rightIcon={<RightIcon />} />
      <FlatList
        data={historyOfBidData}
        renderItem={history}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item, index) => index.toString()}
        ListHeaderComponent={<ListHeaderComponent />}
      />
      <CButton
        title={String.placeBid}
        containerStyle={localStyle.btnStyle}
        type={'B16'}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  bidImageContainer: {
    height: getHeight(220),
    width: '100%',
    borderRadius: moderateScale(8),
    borderWidth: moderateScale(1),
    ...styles.p10,
  },
  bidImage: {
    height: '100%',
    width: '100%',
    borderRadius: moderateScale(8),
  },
  mainContainer: {
    ...styles.ph20,
  },
  innerImageView: {
    height: moderateScale(48),
    width: '90%',
    ...styles.selfCenter,
    borderRadius: moderateScale(8),
    ...styles.p15,
    ...styles.rowSpaceBetween,
    position: 'absolute',
    bottom: moderateScale(10),
  },
  titleAndIcon: {
    ...styles.flexRow,
    ...styles.mt15,
    ...styles.itemsCenter,
  },
  placeBidDescription: {
    lineHeight: moderateScale(20),
  },
  readMoreText: {
    ...styles.ml5,
    top: moderateScale(15),
  },
  increaseAndDecreaseContainer: {
    height: moderateScale(60),
    width: '100%',
    borderRadius: moderateScale(8),
    ...styles.p10,
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  decreaseContainer: {
    height: moderateScale(28),
    width: moderateScale(28),
    borderRadius: moderateScale(6),
    ...styles.center,
  },
  ethereumImage: {
    height: moderateScale(24),
    width: moderateScale(24),
  },
  imageAndText: {
    height: moderateScale(30),
    width: moderateScale(30),
    borderRadius: moderateScale(15),
    ...styles.center,
  },
  imageAndTextContainer: {
    ...styles.rowCenter,
  },
  historyContainer: {
    height: moderateScale(78),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.p10,
    ...styles.rowSpaceBetween,
    ...styles.mv10,
  },
  imageAndUserName: {
    ...styles.flexRow,
    ...styles.center,
  },
  userImage: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
    ...styles.mb20,
  },
});
