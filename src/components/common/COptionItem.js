import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";
import Icons from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CText from "./CText";
import { moderateScale } from "../../common/constants";
import { styles } from "../../themes";
import { useSelector } from "react-redux";

export default function COptionItem({item, index, switchValue, disabled, onSwitchValueChange, onPressItem}) {
  const color = useSelector(state => state.theme.theme);

  if (item.rightIcon === 'switch') {
    return (
      <View
        testID={`optionSwitchItem_${item.id || index}`}
        style={[
          localStyle.renderItemContainer,
          {borderColor: color.dark ? color.grayScale700 : color.grayScale200},
        ]}>
        <View testID="optionLabelContainer" style={styles.rowCenter}>
          <Icons
            testID="optionIcon"
            name={item.icon}
            size={moderateScale(25)}
            color={color.primary}
          />
          <View testID={`optionTextContainer_${item.id || index}`} style={styles.ml10}>
            <CText testID={`optionTitle_${item.id || index}`} type={'B15'}>{item.title}</CText>
            <CText testID={`optionValue_${item.id || index}`} type={'R12'} color={color.grayScale500}>
              {item.value}
            </CText>
          </View>
        </View>
        <Switch
          testID={`optionSwitch_${item.id || index}`}
          value={switchValue}
          onValueChange={(value) => onSwitchValueChange(item, value)}
          trackColor={{
            false: color.grayScale300,
            true: color.primary,
          }}
          thumbColor={color.white}
          disabled={disabled}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      testID={`optionMenuItem_${item.id || index}`}
      disabled={disabled}
      key={index}
      activeOpacity={item.rightIcon ? 1 : 0.5}
      onPress={() => onPressItem(item)}
      style={[
        localStyle.renderItemContainer,
        {
          borderColor: color.dark ? color.grayScale700 : color.grayScale200,
        },
      ]}>
      <View testID={`optionMenuItemContent_${item.id || index}`} style={styles.rowCenter}>
        <View
          testID={`optionMenuItemIconBackground_${item.id || index}`}
          style={[
            localStyle.iconBackground,
            {
              backgroundColor:
                item?.id === 5 || item?.id === 6
                  ? color.primary
                  : color.inputBackground,
            },
          ]}>
          {item.icon ? (
            <Icons
              testID={`optionMenuItemIcon_${item.id || index}`}
              name={item.icon}
              size={moderateScale(20)}
              color={color.dark ? color.grayScale500 : color.grayScale400}
            />
          ) : (
            <View testID={`optionMenuItemCustomIcon_${item.id || index}`}>{color.dark ? item.darkIcon : item.lightIcon}</View>
          )}
        </View>
        <View testID={`optionMenuItemTextContainer_${item.id || index}`} style={styles.ml10}>
          <CText testID={`optionMenuItemTitle_${item.id || index}`} type={'B12'}>{item.title}</CText>
          <CText testID={`optionMenuItemValue_${item.id || index}`} type={'R10'} color={color.grayScale500}>
            {item.value}
          </CText>
        </View>
      </View>

      <Ionicons
        testID={`optionMenuItemArrow_${item.id || index}`}
        name={'chevron-forward-outline'}
        size={moderateScale(24)}
        color={color.dark ? color.grayScale500 : color.grayScale400}
        style={styles.mr10}
      />
    </TouchableOpacity>
  );
};

const localStyle = StyleSheet.create({
  renderItemContainer: {
    height: moderateScale(72),
    borderRadius: moderateScale(12),
    ...styles.rowSpaceBetween,
    ...styles.mv10,
    ...styles.ph10,
    borderWidth: moderateScale(1),
  },
});
