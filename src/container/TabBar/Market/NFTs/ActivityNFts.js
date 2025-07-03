import {
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';

// custom import
import {
  deviceWidth,
  getHeight,
  moderateScale,
} from '../../../../common/constants';
import {styles} from '../../../../themes';
import String from '../../../../i18n/String';
import {ActivityData} from '../../../../api/constant';
import {
  Activity_Select,
  Activity_unSelect,
  CollectionActivity_Dark,
  CollectionActivity_Light,
  FilterIcon,
  GreenTickIcon,
  Item_Select,
  Item_unSelect,
  SendIcon,
  Sort_Dark,
  Sort_Light,
} from '../../../../assets/svg';
import {useSelector} from 'react-redux';
import CHeader from '../../../../components/common/CHeader';
import CText from '../../../../components/common/CText';
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import {StackNav} from '../../../../navigation/NavigationKey';
import images from '../../../../assets/images';

const UserDetail = [
  {
    id: 1,
    title: String.item,
    value: '45.5K',
  },
  {
    id: 2,
    title: String.floorPrice,
    value: '35.6',
    svgDark: <CollectionActivity_Dark />,
    svgLight: <CollectionActivity_Light />,
  },
  {
    id: 3,
    title: String.volume,
    value: '292.2K',
    svgDark: <CollectionActivity_Dark />,
    svgLight: <CollectionActivity_Light />,
  },
];

export default function ActivityNFts({route, navigation}) {
  let item = route?.params?.item;
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(1);

  const categoryData = [
    {
      id: 0,
      title: String.item,
      onPress: () => setIsSelect(0),
      svgDark: <Item_Select />,
      svgLight: <Item_unSelect />,
    },
    {
      id: 1,
      title: String.activity,
      onPress: () => setIsSelect(1),
      svgDark: <Activity_Select />,
      svgLight: <Activity_unSelect />,
    },
  ];
  const HeaderCategory = () => {
    return categoryData.map((item, index) => {
      return (
        <TouchableOpacity
          onPress={item.onPress}
          style={[
            localStyle.root,
            {
              backgroundColor:
                isSelect === item.id
                  ? colors.inputBackground
                  : colors.backgroundColor,
            },
          ]}>
          <View style={localStyle.iconAndText}>
            {isSelect === item.id ? item.svgDark : item.svgLight}
            <CText
              type={'M12'}
              align={'center'}
              style={styles.ml5}
              color={
                isSelect === item.id ? colors.textColor : colors.grayScale400
              }>
              {item.title}
            </CText>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const RightAccessory = () => {
    return (
      <View style={styles.flexRow}>
        <TouchableOpacity style={styles.mr10}>
          <FilterIcon />
        </TouchableOpacity>
        <TouchableOpacity>
          <SendIcon />
        </TouchableOpacity>
      </View>
    );
  };

  const onPressBack = () => {
    navigation.navigate(StackNav.CollectionItem, (item = {item}));
  };
  const onPressCreatedBy = () => {
    navigation.navigate(StackNav.CreatedByCollection);
  };
  const activity = ({item, index}) => {
    return (
      <TouchableOpacity
        style={[
          localStyle.activityContainer,
          {
            borderColor: colors.dark
              ? colors.grayScale700
              : colors.grayScale200,
          },
        ]}>
        <View style={styles.flexRow}>
          <Image source={item.image} style={localStyle.activityImage} />
          <View style={localStyle.titleText}>
            <CText type={'B14'} numberOfLines={1}>
              {item.title}
            </CText>
            <CText
              type={'R12'}
              color={colors.grayScale500}
              style={localStyle.saleText}>
              {item.name}
            </CText>
          </View>
        </View>
        <View style={styles.selfEnd}>
          <CText type={'B14'} style={localStyle.amountAndTime}>
            {item.amount}
          </CText>
          <CText
            type={'r12'}
            color={colors.dark ? colors.grayScale500 : colors.grayScale400}
            style={localStyle.amountAndTime}>
            {item.time}
          </CText>
        </View>
      </TouchableOpacity>
    );
  };
  const RenderUserDetail = ({item}) => {
    return (
      <View style={[styles.itemsCenter, styles.flexRow]}>
        <View>
          <View style={styles.rowCenter}>
            {colors.dark ? item.svgDark : item.svgLight}
            <CText type="b14" align={'center'} style={styles.ml5}>
              {item.value}
            </CText>
          </View>
          <CText
            type="R12"
            align={'center'}
            style={styles.mt5}
            color={colors.grayScale500}>
            {item.title}
          </CText>
        </View>
        {item.id === 3 ? null : (
          <View
            style={[
              localStyle.lineStyle,
              {
                borderColor: colors.dark
                  ? colors.grayScale700
                  : colors.grayScale200,
              },
            ]}
          />
        )}
      </View>
    );
  };

  return (
    <CSafeAreaView>
      <ImageBackground
        source={images.ProfileBgImage}
        style={localStyle.ProfileBgImage}>
          <CHeader
            rightIcon={<RightAccessory />}
            onPressBack={onPressBack}
            color={colors.white}
          />
          <Image style={localStyle.userImage} source={item.image} />
      </ImageBackground>
      <View style={localStyle.mainContainer}>
        <View style={localStyle.iconAndUserName}>
          <CText type={'B18'} style={styles.mr5}>
            {item.title}
          </CText>
          <GreenTickIcon width={16} height={16} style={styles.mt5} />
        </View>
        <View style={localStyle.iconAndText}>
          <CText type={'R12'} color={colors.grayScale500} style={styles.mr5}>
            {String.createdBy}
          </CText>
          <TouchableOpacity onPress={onPressCreatedBy}>
            <CText type={'R12'} color={colors.primary}>
              {String.spacybox}
            </CText>
          </TouchableOpacity>
        </View>
        <View style={[styles.flexRow, styles.justifyEvenly, styles.mt20]}>
          {UserDetail.map((item, index) => (
            <RenderUserDetail item={item} key={index} />
          ))}
        </View>
        <View
          style={[
            localStyle.itemSelectContainer,
            styles.mt15,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <HeaderCategory />
        </View>
        <View style={localStyle.activityHeaderContainer}>
          <CText type={'B16'}>{String.activity}</CText>
          <TouchableOpacity>
            <View style={styles.flexRow}>
              {colors.dark ? <Sort_Dark /> : <Sort_Light />}
              <CText
                type={'M14'}
                color={colors.grayScale500}
                style={localStyle.sortText}>
                {String.sort}
              </CText>
            </View>
          </TouchableOpacity>
        </View>
        <FlatList
          data={ActivityData}
          renderItem={activity}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mb30}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  ProfileBgImage: {
    height: getHeight(150),
    ...styles.mt10,
    zIndex: 0,
  },
  userImage: {
    height: moderateScale(100),
    width: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: moderateScale(3),
    ...styles.selfCenter,
    top: getHeight(100),
    zIndex: 99,
    position: 'absolute',
  },
  lineStyle: {
    width: moderateScale(1),
    borderWidth: moderateScale(1),
    height: '60%',
    ...styles.ml30,
    ...styles.selfCenter,
  },
  activityHeaderContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  iconAndUserName: {
    ...styles.rowCenter,
    marginTop: moderateScale(50),
  },
  iconAndText: {
    ...styles.rowCenter,
  },
  activityContainer: {
    borderRadius: moderateScale(12),
    ...styles.mt15,
    ...styles.ph10,
    ...styles.pv15,
    borderWidth: moderateScale(1),
    ...styles.mr20,
    ...styles.rowSpaceBetween,
    width: deviceWidth - moderateScale(40),
  },
  activityImage: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
  },
  titleText: {
    ...styles.ml10,
    ...styles.mt5,
  },
  amountAndTime: {
    ...styles.ml5,
    ...styles.mt2,
  },
  saleText: {
    ...styles.mt2,
  },
  root: {
    height: moderateScale(36),
    width: '50%',
    ...styles.p10,
    ...styles.center,
    borderRadius: moderateScale(6),
  },
  itemSelectContainer: {
    height: moderateScale(44),
    width: '100%',
    ...styles.rowCenter,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    ...styles.p5,
  },
});
