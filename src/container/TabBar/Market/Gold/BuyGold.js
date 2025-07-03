import {
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState} from 'react';
import Icons from 'react-native-vector-icons/EvilIcons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {useSelector} from 'react-redux';
import {getHeight, moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import KeyBoardAvoidWrapper from '../../../../components/common/KeyBoardAvoidWrapper';
import typography from '../../../../themes/typography';
import {Exchange_Light} from '../../../../assets/svg';
import images from '../../../../assets/images';
import CText from '../../../../components/common/CText';
import CButton from '../../../../components/common/CButton';
import {TabNav} from '../../../../navigation/NavigationKey';

export default function BuyGold({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [amount, setAmount] = useState('');

  const onChangeText = val => setAmount(val);
  const onPressBuy = () => {
    navigation.navigate(TabNav.MarketScreen);
  };

  const RightIcon = () => {
    return (
      <TouchableOpacity>
        <Icons
          name={'question'}
          size={moderateScale(28)}
          color={colors.dark ? colors.grayScale500 : colors.grayScale400}
        />
      </TouchableOpacity>
    );
  };
  const renderItem = ({item}) => {
    return (
      <View style={localStyle.renderItemContainer}>
        <TouchableOpacity
          onPress={() => onChangeText(item)}
          style={[
            localStyle.amountContainer,
            {
              backgroundColor: colors.dark
                ? colors.inputBackground
                : colors.grayScale50,
            },
          ]}>
          <CText type={'s12'} color={colors.grayScale500}>
            {item}
          </CText>
        </TouchableOpacity>
      </View>
    );
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.buyGold} rightIcon={<RightIcon />} />
      <KeyBoardAvoidWrapper contentContainerStyle={localStyle.mainContainer}>
        <View style={localStyle.headerContainer}>
          <Image source={images.GoldImage} style={localStyle.goldImage} />
          <CText type={'M14'}>{'1 Gram = $87.65'}</CText>
        </View>
        <View style={localStyle.inputAmountContainer}>
          <TextInput
            placeholder={'$ 0 '}
            value={amount}
            onChangeText={onChangeText}
            placeholderTextColor={colors.grayScale500}
            style={[
              localStyle.inputStyle,
              {
                color: colors.textColor,
              },
            ]}
            keyboardType={'numeric'}
          />
          <TouchableOpacity
            style={[
              localStyle.exchangeIcon,
              {
                backgroundColor: colors.dark
                  ? colors.inputBackground
                  : colors.grayScale50,
              },
            ]}>
            <Exchange_Light />
          </TouchableOpacity>
        </View>
        <CText type={'S12'} color={colors.grayScale500} align={'center'}>
          {'USD balance $14,456.00'}
        </CText>

        <FlatList
          data={['0,10 g', '0,50 g', '5,00 g', '10,00 g']}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mt20}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </KeyBoardAvoidWrapper>
      <CButton
        type={'B16'}
        title={String.buy}
        containerStyle={localStyle.btnStyle}
        onPress={onPressBuy}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
  },
  headerContainer: {
    ...styles.selfCenter,
    ...styles.mt20,
    ...styles.flexRow,
  },
  goldImage: {
    width: moderateScale(20),
    height: moderateScale(20),
    ...styles.mr5,
  },
  inputStyle: {
    height: getHeight(120),
    width: '70%',
    borderRadius: moderateScale(20),
    textAlign: 'center',
    ...typography.fontSizes.f46,
    ...typography.fontWeights.Bold,
    ...styles.mt30,
  },
  renderItemContainer: {
    ...styles.itemsCenter,
    ...styles.mt30,
  },
  inputAmountContainer: {
    ...styles.rowCenter,
    ...styles.ml25,
  },
  exchangeIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.center,
    ...styles.ml30,
    ...styles.mt30,
  },
  amountContainer: {
    height: getHeight(32),
    width: moderateScale(70),
    borderRadius: moderateScale(8),
    ...styles.center,
    ...styles.mb10,
    marginRight: moderateScale(18),
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
});
