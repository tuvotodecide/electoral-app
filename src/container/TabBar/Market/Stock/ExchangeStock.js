import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Icons from 'react-native-vector-icons/EvilIcons';
import {useSelector} from 'react-redux';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {moderateScale} from '../../../../common/constants';
import {styles} from '../../../../themes';
import images from '../../../../assets/images';
import CText from '../../../../components/common/CText';
import KeyBoardAvoidWrapper from '../../../../components/common/KeyBoardAvoidWrapper';
import {Exchange_Invert} from '../../../../assets/svg';
import CButton from '../../../../components/common/CButton';
import CommonTextInput from '../../../../components/home/CommonTextInput';
import {StackNav} from '../../../../navigation/NavigationKey';

export default function ExchangeStock({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [select, setSelect] = useState(false);
  const [isSelect, setIsSelect] = useState(false);

  const onPressSelectFrom = () => {
    setSelect(!select);
  };

  const onPressSelectTo = () => {
    setIsSelect(!isSelect);
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

  const onPressExchange = () => {
    navigation.navigate(StackNav.StockHistory);
  };

  return (
    <CSafeAreaView>
      <CHeader title={String.exchange} rightIcon={<RightIcon />} />
      <KeyBoardAvoidWrapper containerStyle={localStyle.mainContainer}>
        <CText type={'R14'} align={'center'} color={colors.grayScale500}>
          {String.bitcoinBalance}
        </CText>
        <CText type={'B40'} align={'center'}>
          {'$13,029.46'}
        </CText>
        <View>
          <CommonTextInput
            title={String.from}
            image={images.AmazonImage}
            labelTitle={String.amzn}
            onPressSelect={onPressSelectFrom}
            borderColor={select ? colors.primary : colors.inputBackground}
          />
          <TouchableOpacity
            style={[
              localStyle.exchangeIcon,
              {
                backgroundColor: colors.dark
                  ? colors.inputBackground
                  : colors.grayScale50,
                borderColor: colors.dark
                  ? colors.grayScale700
                  : colors.grayScale100,
              },
            ]}>
            <Exchange_Invert />
          </TouchableOpacity>
          <CommonTextInput
            title={String.to}
            image={images.AirbnbImage}
            labelTitle={String.abnb}
            onPressSelect={onPressSelectTo}
            borderColor={isSelect ? colors.primary : colors.inputBackground}
          />
        </View>
      </KeyBoardAvoidWrapper>
      <CButton
        title={String.convert}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
        onPress={onPressExchange}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.mt20,
  },
  exchangeIcon: {
    height: moderateScale(40),
    width: moderateScale(40),
    borderRadius: moderateScale(20),
    ...styles.selfCenter,
    ...styles.ml30,
    ...styles.center,
    position: 'absolute',
    top: 82,
    zIndex: 99,
    borderWidth: moderateScale(1),
  },
  btnStyle: {
    width: '90%',
    ...styles.selfCenter,
  },
});
