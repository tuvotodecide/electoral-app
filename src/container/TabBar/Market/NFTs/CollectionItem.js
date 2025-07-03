import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useRef, useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import {
  Activity_Select,
  Activity_unSelect,
  FilterIcon,
  Filter_Light,
  Item_Select,
  Item_unSelect,
} from '../../../../assets/svg';
import {moderateScale} from '../../../../common/constants';
import {useSelector} from 'react-redux';
import {styles} from '../../../../themes';
import String from '../../../../i18n/String';
import CText from '../../../../components/common/CText';
import {CollectionItemData} from '../../../../api/constant';
import CollectionFilter from '../../../../components/modal/CollectionFilter';
import {StackNav} from '../../../../navigation/NavigationKey';
import CollectionItemComponents from '../../../../components/home/CollectionItemComponents';

export default function CollectionItem({route, navigation}) {
  let item = route?.params?.item;
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState(0);

  const SheetRef = useRef(null);

  const onPressFilter = () => {
    SheetRef?.current?.show();
  };

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
      onPress: () => {
        navigation.navigate(StackNav.ActivityNFts, (item = {item}));
      },
      svgDark: <Activity_Select />,
      svgLight: <Activity_unSelect />,
    },
  ];

  const onPressApply = () => {
    SheetRef?.current?.hide();
  };

  const RightIcon = () => {
    return (
      <TouchableOpacity style={styles.rowSpaceBetween}>
        <Ionicons
          name={'share-outline'}
          size={moderateScale(24)}
          color={colors.white}
        />
      </TouchableOpacity>
    );
  };

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

  const renderItem = ({item}) => {
    return <CollectionItemComponents item={item} />;
  };

  const FooterComponent = () => {
    return (
      <TouchableOpacity
        onPress={onPressFilter}
        style={[
          localStyle.bottomFilterBtn,
          {
            backgroundColor: colors.textColor,
          },
        ]}>
        {colors.dark ? <Filter_Light /> : <FilterIcon />}
        <CText
          type={'B16'}
          color={colors.dark ? colors.black : colors.white}
          style={styles.ml10}>
          {String.filter}
        </CText>
      </TouchableOpacity>
    );
  };

  return (
    <CSafeAreaView>
      <CHeader title={item.title} rightIcon={<RightIcon />} />
      <View style={localStyle.mainContainer}>
        <View
          style={[
            localStyle.itemSelectContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <HeaderCategory />
        </View>
        {isSelect === 0 ? (
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={localStyle.itemAndSearchContainer}>
              <CText type={'B16'}>{'2.456' + String.item}</CText>
              <TouchableOpacity>
                <Ionicons
                  name={'search-outline'}
                  size={moderateScale(24)}
                  color={colors.grayScale500}
                  style={styles.ml15}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CollectionItemData}
              renderItem={renderItem}
              numColumns={2}
              key={2}
              keyExtractor={(item, index) => index.id}
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: moderateScale(130)}}
              ListFooterComponent={FooterComponent}
            />
          </ScrollView>
        ) : null}
      </View>
      <CollectionFilter
        SheetRef={SheetRef}
        onPressApply={onPressApply}
        onPressClose={onPressApply}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  root: {
    height: moderateScale(36),
    width: '50%',
    ...styles.p10,
    ...styles.center,
    borderRadius: moderateScale(6),
  },
  mainContainer: {
    ...styles.ph20,
  },
  itemSelectContainer: {
    height: moderateScale(44),
    width: '100%',
    ...styles.rowCenter,
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(8),
    ...styles.p5,
  },
  iconAndText: {
    ...styles.rowCenter,
  },

  itemAndSearchContainer: {
    ...styles.rowSpaceBetween,
    ...styles.mt20,
  },
  bottomFilterBtn: {
    height: moderateScale(48),
    width: '40%',
    ...styles.selfCenter,
    ...styles.flexRow,
    borderRadius: moderateScale(12),
    ...styles.center,
  },
});
