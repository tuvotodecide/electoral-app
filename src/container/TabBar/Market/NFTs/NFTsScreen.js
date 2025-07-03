import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';

// custom import
import {styles} from '../../../../themes';
import {useSelector} from 'react-redux';
import CText from '../../../../components/common/CText';
import String from '../../../../i18n/String';
import {HotBidsData, hotCollectionData} from '../../../../api/constant';
import {moderateScale} from '../../../../common/constants';
import {StackNav} from '../../../../navigation/NavigationKey';
import {useNavigation} from '@react-navigation/native';

export default function NFTsScreen() {
  const colors = useSelector(state => state.theme.theme);
  const navigation = useNavigation();

  const onPressHotBid = item => {
    navigation.navigate(StackNav.PlaceBid, {item});
  };
  const onPressItem = item => {
    if (!!item.route) {
      navigation.navigate(item.route, {item});
    }
  };

  const hotCollection = ({item, index}) => {
    return (
      <TouchableOpacity
        style={localStyle.hotCollectionContainer}
        onPress={() => onPressItem(item)}>
        <ImageBackground source={item.image} style={localStyle.collectionImage}>
          <View
            style={[
              localStyle.itemBackground,
              {
                backgroundColor:
                  item.id === 1
                    ? colors.primary
                    : item.id === 2
                    ? colors.blue
                    : item.id === 3
                    ? colors.black
                    : colors.grayScale400,
              },
            ]}>
            <CText>{item.itemNo}</CText>
          </View>
        </ImageBackground>

        <CText
          type={'S12'}
          align={'center'}
          style={localStyle.collectionText}
          numberOfLines={1}>
          {item.title}
        </CText>
        <CText
          type={'S10'}
          align={'center'}
          color={colors.grayScale500}
          style={localStyle.collectionText}>
          {item.price}
        </CText>
      </TouchableOpacity>
    );
  };

  const hotBids = ({item, index}) => {
    return (
      <TouchableOpacity
        onPress={() => onPressHotBid(item)}
        style={[
          localStyle.hotBidMainContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <Image source={item.image} style={localStyle.hotBidImage} />
        <View style={localStyle.titleAndIcon}>
          <CText type={'B10'} color={colors.grayScale500} style={styles.mr5}>
            {item.title}
          </CText>
          {item.svgIcon}
        </View>
        <CText type={'B12'} style={localStyle.hotBidText}>
          {item.name}
        </CText>
        <View
          style={[
            localStyle.bottomHotContainer,
            {
              backgroundColor: colors.inputBackground,
            },
          ]}>
          <View style={localStyle.bottomInnerHotContainer}>
            <CText type={'S8'} color={colors.grayScale500}>
              {item.priceText}
            </CText>
            <CText type={'S8'} color={colors.grayScale500}>
              {item.current}
            </CText>
          </View>
          <View style={localStyle.priceAndBidContainer}>
            <CText type={'B10'} color={colors.primary}>
              {item.price}
            </CText>
            <CText type={'B10'}>{item.currentBid}</CText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View>
      <View style={localStyle.headerTextContainer}>
        <CText type={'B16'}>{String.hotCollections}</CText>
        <TouchableOpacity>
          <CText type={'M14'} color={colors.primary}>
            {String.seeAll}
          </CText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={hotCollectionData}
        renderItem={hotCollection}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        bounces={false}
      />
      <View style={localStyle.headerTextContainer}>
        <CText type={'B16'}>{String.hotBids}</CText>
        <TouchableOpacity>
          <CText type={'M14'} color={colors.primary}>
            {String.seeAll}
          </CText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={HotBidsData}
        renderItem={hotBids}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        bounces={false}
        contentContainerStyle={styles.mb20}
      />
    </View>
  );
}

const localStyle = StyleSheet.create({
  headerTextContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  hotCollectionContainer: {
    ...styles.mh10,
    ...styles.mt20,
  },
  collectionImage: {
    height: moderateScale(56),
    width: moderateScale(56),
  },
  collectionText: {
    ...styles.mt5,
    width: moderateScale(75),
  },
  itemBackground: {
    height: moderateScale(20),
    width: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: moderateScale(1),
    ...styles.selfEnd,
    top: moderateScale(35),
    left: moderateScale(3),
    ...styles.center,
  },
  hotBidMainContainer: {
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.mr20,
    ...styles.mt20,
    height: moderateScale(243),
    width: moderateScale(195),
    ...styles.ph10,
    ...styles.pv10,
  },
  hotBidImage: {
    height: moderateScale(124),
    width: '100%',
    borderRadius: moderateScale(8),
  },
  hotBidText: {
    ...styles.mt5,
  },
  titleAndIcon: {
    ...styles.flexRow,
    ...styles.mt5,
    ...styles.itemsCenter,
  },
  bottomHotContainer: {
    height: moderateScale(47),
    width: '100%',
    borderRadius: moderateScale(6),
    ...styles.ph5,
    ...styles.pv10,
    ...styles.mt15,
  },
  bottomInnerHotContainer: {
    ...styles.rowSpaceBetween,
  },
  priceAndBidContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mv5,
  },
});
