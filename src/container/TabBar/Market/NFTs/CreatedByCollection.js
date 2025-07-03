import {
  View,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icons from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import images from '../../../../assets/images';
import CHeader from '../../../../components/common/CHeader';
import {getHeight, moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import CText from '../../../../components/common/CText';
import String from '../../../../i18n/String';
import {GreenTickIcon} from '../../../../assets/svg';
import {useSelector} from 'react-redux';
import {
  CollectionItemData,
  SpacyBoxUserDetails,
} from '../../../../api/constant';
import CButton from '../../../../components/common/CButton';
import CollectionItemComponents from '../../../../components/home/CollectionItemComponents';

export default function CreatedByCollection() {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(0);

  const categoryData = [
    {
      id: 0,
      title: String.owned,
      onPress: () => setIsSelect(0),
      value: '27k',
    },
    {
      id: 1,
      title: String.created,
      onPress: () => setIsSelect(1),
      value: '12k',
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
              borderBottomColor:
                isSelect === item.id
                  ? colors.textColor
                  : colors.backgroundColor,
            },
          ]}>
          <View style={localStyle.textAndFollowersContainer}>
            <CText
              type={'B14'}
              align={'center'}
              style={styles.ml5}
              color={
                isSelect === item.id ? colors.textColor : colors.grayScale500
              }>
              {item.title}
            </CText>
            <View
              style={[
                localStyle.followersValueContainer,
                {
                  backgroundColor: colors.inputBackground,
                },
              ]}>
              <CText type={'B10'}>{item.value}</CText>
            </View>
          </View>
        </TouchableOpacity>
      );
    });
  };

  const renderItem = ({item}) => {
    return <CollectionItemComponents item={item} />;
  };
  const RenderUserDetail = ({item}) => {
    return (
      <View style={[styles.flexRow, styles.itemsCenter]}>
        <View>
          <CText type="b14" align={'center'} style={styles.ml5}>
            {item.value}
          </CText>
          <CText
            type="R12"
            align={'center'}
            style={styles.mt5}
            color={colors.grayScale500}>
            {item.title}
          </CText>
        </View>
        <View>
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
      </View>
    );
  };
  const LeftIcon = () => {
    return (
      <TouchableOpacity>
        <Icons name={'plus'} color={colors.white} size={moderateScale(20)} />
      </TouchableOpacity>
    );
  };
  return (
    <CSafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <ImageBackground
          source={images.BackgroundImage}
          style={localStyle.headerImage}>
          <CHeader />
        </ImageBackground>
        <Image style={localStyle.userImage} source={images.SpicyBoxImage} />
        <View style={localStyle.mainContainer}>
          <View style={localStyle.iconAndNameContainer}>
            <CText type={'B18'} style={localStyle.userNameText}>
              {String.spacybox}
            </CText>
            <GreenTickIcon width={16} height={16} style={styles.mt5} />
          </View>
          <TouchableOpacity
            style={[
              localStyle.copyIdContainer,
              {backgroundColor: colors.inputBackground},
            ]}>
            <CText type={'S10'} color={colors.grayScale500} align={'center'}>
              {'0xa05859...098'}
            </CText>
            <Ionicons
              name={'copy-outline'}
              color={colors.grayScale500}
              style={styles.ml5}
            />
          </TouchableOpacity>
          <View style={[styles.mt20, styles.rowSpaceBetween, styles.ph10]}>
            {SpacyBoxUserDetails.map((item, index) => (
              <RenderUserDetail item={item} key={index} />
            ))}
          </View>
          <View style={localStyle.btnAndNotification}>
            <CButton
              title={String.followers}
              type={'B16'}
              frontIcon={<LeftIcon />}
              style={styles.ml5}
              containerStyle={localStyle.followBtn}
            />
            <View
              style={[
                localStyle.notificationDotsContainer,
                {
                  backgroundColor: colors.inputBackground,
                },
              ]}>
              <MaterialIcon
                size={moderateScale(24)}
                name={'dots-horizontal'}
                color={colors.grayScale500}
              />
            </View>
          </View>
          <View style={localStyle.itemSelectContainer}>
            <HeaderCategory />
          </View>
          {isSelect === 0 ? (
            <View style={styles.mt10}>
              <FlatList
                data={CollectionItemData}
                renderItem={renderItem}
                numColumns={2}
                key={2}
                keyExtractor={(item, index) => index.id}
                bounces={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </CSafeAreaView>
  );
}
const localStyle = StyleSheet.create({
  headerImage: {
    width: '100%',
    height: getHeight(190),
  },
  userImage: {
    height: moderateScale(100),
    width: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: moderateScale(3),
    ...styles.selfCenter,
    position: 'absolute',
    top: moderateScale(130),
  },
  iconAndNameContainer: {
    ...styles.rowCenter,
    ...styles.mt40,
  },
  userNameText: {
    ...styles.mr5,
  },
  copyIdContainer: {
    height: moderateScale(24),
    width: moderateScale(112),
    borderRadius: moderateScale(36),
    ...styles.selfCenter,
    ...styles.mt10,
    ...styles.center,
    ...styles.flexRow,
  },
  lineStyle: {
    width: moderateScale(1),
    borderWidth: moderateScale(1),
    height: moderateScale(30),
    ...styles.mh40,
    ...styles.selfCenter,
  },
  mainContainer: {
    ...styles.ph20,
  },
  notificationDotsContainer: {
    height: moderateScale(56),
    width: moderateScale(56),
    borderRadius: moderateScale(12),
    ...styles.center,
  },
  followBtn: {
    width: '80%',
    ...styles.mr10,
  },
  btnAndNotification: {
    ...styles.rowCenter,
    ...styles.mt10,
  },
  root: {
    height: moderateScale(36),
    width: '50%',
    ...styles.p10,
    ...styles.center,
    borderRadius: moderateScale(6),
    borderBottomWidth: moderateScale(1),
  },
  textAndFollowersContainer: {
    ...styles.rowCenter,
  },
  followersValueContainer: {
    height: moderateScale(20),
    width: moderateScale(34),
    borderRadius: moderateScale(10),
    ...styles.center,
    ...styles.ml10,
  },
  itemSelectContainer: {
    height: moderateScale(44),
    width: '100%',
    ...styles.rowCenter,
    ...styles.p5,
  },
});
