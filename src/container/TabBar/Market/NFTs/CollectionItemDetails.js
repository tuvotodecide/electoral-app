import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import {styles} from '../../../../themes';
import {
  deviceWidth,
  getHeight,
  moderateScale,
} from '../../../../common/constants';
import {useSelector} from 'react-redux';
import CText from '../../../../components/common/CText';
import String from '../../../../i18n/String';
import {CollectionItemDetailsData} from '../../../../api/constant';
import CButton from '../../../../components/common/CButton';

export default function CollectionItemDetails({route}) {
  let item = route?.params?.item;
  const colors = useSelector(state => state.theme.theme);
  const [isLike, setIsLike] = useState(false);

  const RightIcon = () => {
    return (
      <TouchableOpacity style={styles.rowSpaceBetween}>
        <Ionicons
          name={'ellipsis-vertical'}
          size={moderateScale(24)}
          color={colors.textColor}
        />
      </TouchableOpacity>
    );
  };

  const onPressLikeButton = () => {
    setIsLike(!isLike);
  };

  const collectionDetails = ({item, index}) => {
    return (
      <View
        style={[
          localStyle.collectionDetailsContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.flexRow}>
          <Image source={item.image} style={localStyle.livePriceImage} />
          <View style={localStyle.titleText}>
            <CText type={'R10'} color={colors.grayScale500}>
              {item.title}
            </CText>
            <CText type={'B14'}>{item.name}</CText>
          </View>
        </View>
        <CText type={'B14'} style={localStyle.profitAndLossText}>
          {item.value}
        </CText>
      </View>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader rightIcon={<RightIcon />} />
      <ScrollView
        contentContainerStyle={localStyle.mainContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            localStyle.imageBackgroundBox,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <Image source={item.images} style={localStyle.userImage} />
        </View>
        <View style={localStyle.userNameAndLikeContainer}>
          <CText type={'B20'}> {item.userName}</CText>
          <TouchableOpacity onPress={onPressLikeButton}>
            <Ionicons
              name={isLike ? 'heart' : 'heart-outline'}
              size={moderateScale(24)}
              color={colors.alertColor}
            />
          </TouchableOpacity>
        </View>
        <View style={localStyle.userImageAndName}>
          <Image source={item.images} style={localStyle.imageStyle} />
          <CText type={'B12'} color={colors.grayScale500} style={styles.m10}>
            {item.name}
          </CText>
          {item.svgIcon}
        </View>
        <CText
          type={'R12'}
          numberOfLines={3}
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
            localStyle.lineView,
            {
              backgroundColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}
        />
        <FlatList
          data={CollectionItemDetailsData}
          renderItem={collectionDetails}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          bounces={false}
        />
      </ScrollView>
      <CButton
        title={String.buyNowFor + '0.500 ETH'}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  imageBackgroundBox: {
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.ph20,
    ...styles.pv10,
  },
  userImage: {
    height: getHeight(340),
    width: deviceWidth - moderateScale(60),
    borderRadius: moderateScale(8),
    ...styles.selfCenter,
  },
  userNameAndLikeContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt10,
  },
  imageStyle: {
    height: moderateScale(20),
    width: moderateScale(20),
    borderRadius: moderateScale(10),
  },
  userImageAndName: {
    ...styles.flexRow,
    ...styles.itemsCenter,
  },
  placeBidDescription: {
    lineHeight: moderateScale(20),
  },
  readMoreText: {
    ...styles.ml5,
    top: moderateScale(15),
  },
  lineView: {
    width: '100%',
    height: moderateScale(1),
    ...styles.mv20,
  },
  collectionDetailsContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt15,
    ...styles.ph10,
    ...styles.pv15,
    borderWidth: moderateScale(1),
    ...styles.mr20,
    ...styles.rowSpaceBetween,
    width: deviceWidth - moderateScale(40),
  },
  titleText: {
    ...styles.ml10,
    ...styles.mt5,
  },
  livePriceImage: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  btnStyle: {
    ...styles.selfCenter,
    width: '90%',
    ...styles.mb30,
  },
});
