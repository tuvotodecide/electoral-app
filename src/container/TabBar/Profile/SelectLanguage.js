import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import {moderateScale} from '../../../common/constants';
import {styles} from '../../../themes';
import {useSelector} from 'react-redux';
import CText from '../../../components/common/CText';
import {LanguageData} from '../../../api/constant';
import CButton from '../../../components/common/CButton';
import {StackNav, TabNav} from '../../../navigation/NavigationKey';

export default function SelectLanguage({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const [isSelect, setIsSelect] = useState('English (USA)');

  const onPressLanguage = item => {
    setIsSelect(item.lName);
  };

  const languages = ({item, index}) => {
    return (
      <TouchableOpacity
        testID={`selectLanguageItem_${index}`}
        onPress={() => onPressLanguage(item)}
        style={[
          localStyle.languageContainer,
          {
            borderColor:
              isSelect === item.lName
                ? colors.primary
                : colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            backgroundColor:
              isSelect === item.lName
                ? colors.dark
                  ? colors.inputBackground
                  : colors.grayScale60
                : colors.backgroundColor,
          },
        ]}>
        <View testID={`selectLanguageFlagAndNameContainer_${index}`} style={localStyle.flagAndNameContainer}>
          {item.svgIcon}
          <CText
            testID={`selectLanguageName_${index}`}
            type={'B14'}
            color={isSelect === item.lName ? colors.primary : colors.textColor}
            style={styles.ml10}>
            {item.lName}
          </CText>
        </View>
        <Ionicons
          testID={`selectLanguageRadio_${index}`}
          name={
            isSelect === item?.lName ? 'radio-button-on' : 'radio-button-off'
          }
          size={moderateScale(22)}
          color={
            isSelect === item?.lName
              ? colors.primary
              : colors.dark
              ? colors.grayScale700
              : colors.grayScale200
          }
        />
      </TouchableOpacity>
    );
  };
  const FooterComponent = () => {
    return (
      <CButton
        testID="selectLanguageChangeButton"
        title={String.changeLanguage}
        type={'B16'}
        onPress={onPressChangeLanguage}
      />
    );
  };

  const onPressChangeLanguage = () => {
    navigation.navigate(TabNav.Profile);
  };

  return (
    <CSafeAreaView testID="selectLanguageContainer">
      <CHeader testID="selectLanguageHeader" title={String.language} />
      <FlatList
        testID="selectLanguageList"
        data={LanguageData}
        renderItem={languages}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.ph20}
        ListFooterComponent={FooterComponent}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  languageContainer: {
    height: moderateScale(64),
    ...styles.mv10,
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    ...styles.center,
    ...styles.rowSpaceBetween,
    ...styles.ph10,
  },
  flagAndNameContainer: {
    ...styles.flexRow,
  },
});
