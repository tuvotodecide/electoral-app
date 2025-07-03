import {
  FlatList,
  Image,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CText from '../../../components/common/CText';
import String from '../../../i18n/String';
import {deviceWidth, getHeight, moderateScale} from '../../../common/constants';
import {useSelector} from 'react-redux';
import {styles} from '../../../themes';
import {MyWalletCategoryData, MyWalletData} from '../../../api/constant';
import CHeader from '../../../components/common/CHeader';

export default function WalletScreen({navigation}) {
  const colors = useSelector(state => state.theme.theme);

  const onPressItem = item => {
    if (item.route) {
      navigation.navigate(item.route);
    }
  };
  const myWalletCategory = ({item, index}) => {
    return (
      <View>
        <TouchableOpacity
          onPress={() => onPressItem(item)}
          style={[
            localStyle.portfolioContainer,
            {
              backgroundColor: colors.gradientBackground,
            },
          ]}>
          {item.svgIcon}
        </TouchableOpacity>
        <CText
          type={'B12'}
          align={'center'}
          color={colors.white}
          style={localStyle.walletCategoryText}>
          {item.title}
        </CText>
      </View>
    );
  };

  const RenderHeader = ({title}) => {
    return (
      <CText
        type="M14"
        style={styles.mt20}
        color={colors.dark ? colors.grayScale500 : colors.grayScale400}>
        {title}
      </CText>
    );
  };

  const RenderWalletData = ({item, index}) => {
    return (
      <TouchableOpacity
        style={[
          localStyle.livePriceContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.flexRow}>
          <Image source={item.image} style={localStyle.livePriceImage} />
          <View style={localStyle.titleText}>
            <CText type={'B14'}>{item.title}</CText>
            <CText
              type={'S10'}
              color={colors.grayScale500}
              style={localStyle.newsTypeText}>
              {item.time}
            </CText>
          </View>
        </View>
        <View>
          <CText
            type={'B16'}
            color={item.loss ? colors.alertColor : colors.textColor}>
            {item.profit ? item.profit : item.loss}
          </CText>
          <CText
            type={'S12'}
            color={colors.grayScale500}
            style={localStyle.profitAndLossText}>
            {item.profitValue}
          </CText>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaView>
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1.6}}
        style={localStyle.headerContainer}
        colors={[colors.gradient1, colors.gradient2, colors.gradient1]}>
        <CHeader color={colors.white} />
        <View style={localStyle.mainContainer}>
          <CText type={'R14'} color={colors.primary2} style={styles.mt15}>
            {String.usdBalance}
          </CText>
          <View style={[localStyle.assetContainer, {gap: moderateScale(10)}]}>
            <CText color={colors.white} type={'B32'}>
              {'$8,786.55'}
            </CText>
            <Ionicons
              name={'eye-outline'}
              size={moderateScale(24)}
              color={colors.white}
            />
          </View>

          <FlatList
            data={MyWalletCategoryData}
            renderItem={myWalletCategory}
            horizontal
            keyExtractor={(item, index) => index.toString()}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mt10}
          />
        </View>
      </LinearGradient>
      <View style={localStyle.mainContainer}>
        <View style={localStyle.transactionContainer}>
          <CText type={'B16'}>{String.transactions}</CText>
          <TouchableOpacity>
            <CText type={'M14'} color={colors.primary}>
              {String.seeAll}
            </CText>
          </TouchableOpacity>
        </View>
        <SectionList
          sections={MyWalletData}
          keyExtractor={(item, index) => item + index}
          renderItem={({item}) => <RenderWalletData item={item} />}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          renderSectionHeader={({section: {title}}) => (
            <RenderHeader title={title} />
          )}
          contentContainerStyle={localStyle.itemContainer}
          // bounces={false}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  headerContainer: {
    height: getHeight(300),
  },
  portfolioContainer: {
    height: moderateScale(48),
    width: moderateScale(48),
    borderRadius: moderateScale(48 / 2),
    ...styles.center,
    ...styles.mt20,
    marginHorizontal: moderateScale(18),
  },
  mainContainer: {
    ...styles.ph20,
    flex: 1,
  },

  assetContainer: {
    ...styles.flexRow,
    ...styles.itemsCenter,
  },

  walletCategoryText: {
    ...styles.mt10,
  },
  transactionContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  livePriceContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt15,
    ...styles.ph10,
    ...styles.pv15,
    borderWidth: moderateScale(1),
    ...styles.mr20,
    ...styles.rowSpaceBetween,
    width: deviceWidth - moderateScale(40),
  },
  livePriceImage: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  titleText: {
    ...styles.ml10,
    ...styles.mt5,
  },
  profitAndLossText: {
    ...styles.ml5,
    ...styles.mt2,
  },
  itemContainer: {
    ...styles.mb30,
  },
});
