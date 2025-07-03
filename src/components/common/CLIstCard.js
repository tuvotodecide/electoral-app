import { Image, Pressable, StyleSheet, View } from "react-native";
import { styles } from "../../themes";
import { moderateScale } from "../../common/constants";
import CText from "./CText";
import { useSelector } from "react-redux";
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function CListCard({item, index, onPress, size = 'normal'}) {
  const colors = useSelector(state => state.theme.theme);

  return (
    <Pressable key={index} style={item.style} onPress={onPress}>
      <View style={[localStyle.titleAndValueContainer, size === 'small' ? styles.mb5 : {}]}>
        <View style={localStyle.titleAndIconContainer}>
          {item.iconUrl ?
            <Image
              source={{uri: item.iconUrl}}
              style={{
                width: item.iconSize ?? moderateScale(20),
                height: item.iconSize ?? moderateScale(20),
              }}
            />
            :null
          }
          {item.icon ? 
            <Ionicons
              name={item.icon}
              color={colors.primary}
              size={item.iconSize ?? moderateScale(20)}
            />
            :null
          }
          <View>
            <CText type={item.titleSize ?? 'R14'} color={item.detail ? colors.textColor : colors.grayScale500}>
              {item.title}
            </CText>
            {item.detail ?
              <CText type={item.detailSize ?? 'R12'} color={colors.grayScale500}>
                {item.detail}
              </CText>
              : null
            }
          </View>
        </View>
        { typeof item.value === 'string' ?
          <CText type={'M14'} color={colors.textColor}>
            {item.value}
          </CText>
          : item.value
        }
      </View>
      {size === 'normal' ?
        <View
          style={[
            localStyle.lineView,
            {
              backgroundColor: colors.dark
                ? colors.grayScale700
                : colors.grayScale200,
            },
          ]}
        />
        : null
      }
      
    </Pressable>
  );
};

const localStyle = StyleSheet.create({
  titleAndValueContainer: {
    ...styles.rowSpaceBetween,
  },
  titleAndIconContainer: {
    ...styles.rowStart,
    gap: 10,
  },
  lineView: {
    width: '100%',
    height: moderateScale(1),
    ...styles.mv15,
  },
});