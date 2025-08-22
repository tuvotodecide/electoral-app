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
import CSafeAreaView from '../common/CSafeAreaView';
import CHeader from '../common/CHeader';
import KeyBoardAvoidWrapper from '../common/KeyBoardAvoidWrapper';
import {styles} from '../../themes';
import {getHeight, moderateScale} from '../../common/constants';
import typography from '../../themes/typography';
import CText from '../common/CText';
import {useSelector} from 'react-redux';
import String from '../../i18n/String';
import CButton from '../common/CButton';

export default function MyWalletCommonComponent(props) {
  let {
    title,
    titleText,
    placeholderText,
    value,
    onChangeText,
    svgIcon,
    BankName,
    paymentType,
    onPressChange,
    btnTitle,
    image,
    onPressPreview,
  } = props;
  const colors = useSelector(state => state.theme.theme);

  const [amount, setAmount] = useState('');

  const onChangeTextVal = val => setAmount(val);

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
          onPress={() => onChangeTextVal(item)}
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
      <CHeader title={title} rightIcon={<RightIcon />} />
      <KeyBoardAvoidWrapper contentContainerStyle={localStyle.mainContainer}>
        <View style={localStyle.inputAmountContainer}>
          <TextInput
            placeholder={placeholderText}
            value={value}
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
        </View>
        <CText
          type={'S12'}
          color={colors.grayScale500}
          align={'center'}
          style={localStyle.titleText}>
          {titleText}
        </CText>
        <View
          style={[
            localStyle.cardDetailContainer,
            {
              borderColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}>
          <View style={localStyle.imageAndTitleContainer}>
            {svgIcon ? (
              <View
                style={[
                  localStyle.bankImage,
                  {backgroundColor: colors.inputBackground},
                ]}>
                {svgIcon}
              </View>
            ) : (
              <Image source={image} style={localStyle.userImage} />
            )}
            <View style={localStyle.titleAndValueContainer}>
              <CText type={'B14'} numberOfLines={1}>
                {BankName}
              </CText>
              <CText type={'R12'} color={colors.grayScale500} numberOfLines={1}>
                {paymentType}
              </CText>
            </View>
          </View>
          <TouchableOpacity onPress={onPressChange}>
            <CText type={'B12'} color={colors.primary}>
              {String.change}
            </CText>
          </TouchableOpacity>
        </View>
        {title === String.withdraw ? (
          <FlatList
            data={['25%', '50%', '75% ', '100%']}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.mt20}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        ) : null}
      </KeyBoardAvoidWrapper>
      <CButton
        title={btnTitle}
        containerStyle={localStyle.btnStyle}
        onPress={onPressPreview}
        type={'B16'}
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
    width: '100%',
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
    top: moderateScale(50),
  },
  cardDetailContainer: {
    width: '100%',
    height: getHeight(78),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.ph20,
    ...styles.pv15,
    ...styles.rowSpaceBetween,
    ...styles.mt30,
  },
  imageAndTitleContainer: {
    ...styles.rowCenter,
  },
  bankImage: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.center,
  },
  titleAndValueContainer: {
    ...styles.ml10,
  },
  titleText: {
    ...styles.mt20,
  },
  btnStyle: {
    ...styles.selfCenter,
    width: '90%',
  },
  amountContainer: {
    height: getHeight(32),
    width: moderateScale(70),
    borderRadius: moderateScale(8),
    ...styles.center,
    ...styles.mb10,
    marginRight: moderateScale(18),
  },
  userImage: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
});
