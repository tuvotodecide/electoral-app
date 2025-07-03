import {StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Icons from 'react-native-vector-icons/EvilIcons';

// custom import
import CSafeAreaView from '../../../../components/common/CSafeAreaView';
import CHeader from '../../../../components/common/CHeader';
import String from '../../../../i18n/String';
import {useSelector} from 'react-redux';
import {moderateScale} from '../../../../common/constants';
import KeyBoardAvoidWrapper from '../../../../components/common/KeyBoardAvoidWrapper';
import CText from '../../../../components/common/CText';
import CommonTextInput from '../../../../components/home/CommonTextInput';
import images from '../../../../assets/images';
import {styles} from '../../../../themes';
import CButton from '../../../../components/common/CButton';
import {StackNav} from '../../../../navigation/NavigationKey';

export default function AutoInvestGold({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [title, setTitle] = useState(String.reviewAutoInvest);

  const [select, setSelect] = useState(false);
  const [isSelect, setIsSelect] = useState(false);

  const onPressSelectFrom = () => {
    setSelect(!select);
  };
  const onPressSelectTo = () => {
    setIsSelect(!isSelect);
  };

  const onPressAutoInvest = () => {
    navigation.navigate(StackNav.SuccessfulInvest, {title: title});
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

  return (
    <CSafeAreaView>
      <CHeader title={String.autoInvest} rightIcon={<RightIcon />} />
      <KeyBoardAvoidWrapper containerStyle={localStyle.mainContainer}>
        <CText type={'R14'} align={'center'} color={colors.grayScale500}>
          {String.walletBalance}
        </CText>
        <CText type={'B40'} align={'center'}>
          {'$13,029.46'}
        </CText>
        <View>
          <CommonTextInput
            title={String.amount}
            image={images.DollarGreenImage}
            labelTitle={String.usd}
            onPressSelect={onPressSelectFrom}
            borderColor={select ? colors.primary : colors.inputBackground}
          />
          <CommonTextInput
            title={String.estimated}
            image={images.GoldImage}
            labelTitle={String.gram}
            onPressSelect={onPressSelectTo}
            borderColor={isSelect ? colors.primary : colors.inputBackground}
          />
        </View>
      </KeyBoardAvoidWrapper>
      <CButton
        title={String.reviewAutoInvest}
        type={'B16'}
        containerStyle={localStyle.btnStyle}
        onPress={onPressAutoInvest}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.mt40,
  },
  btnStyle: {
    ...styles.selfCenter,
    width: '90%',
  },
});
