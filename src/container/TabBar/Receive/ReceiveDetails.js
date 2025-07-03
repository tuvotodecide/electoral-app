import { StyleSheet, View } from "react-native";
import CHeader from "../../../components/common/CHeader";
import CSafeAreaView from "../../../components/common/CSafeAreaView";
import Ionicons from 'react-native-vector-icons/Ionicons';

import String from '../../../i18n/String';
import { styles } from "../../../themes";
import { moderateScale } from "../../../common/constants";
import { useDispatch, useSelector } from "react-redux";
import CText from "../../../components/common/CText";
import CInput from "../../../components/common/CInput";
import CButton from "../../../components/common/CButton";
import CAlert from "../../../components/common/CAlert";
import DateTimePicker from "react-native-modal-datetime-picker";
import { useEffect, useState } from "react";
import { StackNav } from "../../../navigation/NavigationKey";
import { setReceiveBsData } from "../../../redux/action/walletAction";

export default function ReceiveDetails({navigation}) {
  const colors = useSelector(state => state.theme.theme);
  const defaultQrData = useSelector(state => state.receiveBs);
	const dispatch = useDispatch();
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const [editData, setEditData] = useState({
		amount: 0,
		reference: '',
		validUntil: '',
  });

	useEffect(() => {
		setEditData(defaultQrData);
	}, [defaultQrData]);

	const onChangeAmount = (value) => {
		setEditData({
			...editData,
			amount: value
		});
	}

	const onChangeReference = (value) => {
		setEditData({
			...editData,
			reference: value
		});
	}

  const openDatePicker = () => {
    setIsDatePickerVisible(true);
  }

  const onConfirmDate = (date) => {
		const value = date.toISOString().split('T')[0];
    setEditData({
			...editData,
			validUntil: value,
		});
    setIsDatePickerVisible(false);
  }

  const onCancelDate = () => {
    setIsDatePickerVisible(false);
  }

  const onUpdateQr = async () => {
		dispatch(setReceiveBsData(editData));
    navigation.navigate(StackNav.ReceiveWithQR);
  }
  
	return(
		<CSafeAreaView style={localStyle.container}>
			<CHeader title={String.receiveWithQR} />
			<View style={{...localStyle.detailContainer, borderColor: colors.grayScale700}}>
				<CText type="B14" style={styles.mt10}>
					{String.amountToReceive}
				</CText>
				<CInput
					_value={editData.amount}
					keyBoardType='numeric'
					maxLength={5}
					autoCapitalize={'none'}
					placeholderTextColor={colors.textColor}
					rightAccessory={() => <CText>Bs.</CText>}
          toGetTextFieldValue={onChangeAmount}
				/>
        <CAlert
          message={String.amountTip}
        />
				<CText type="B14" style={styles.mt10}>
					{String.reference}
				</CText>
				<CInput
					_value={editData.reference}
					keyBoardType={'default'}
					maxLength={10}
					autoCapitalize={'none'}
					placeholderTextColor={colors.textColor}
          toGetTextFieldValue={onChangeReference}
				/>
        <CText type="B14" style={styles.mt10}>
					{String.validUntil}
				</CText>
				<CInput
					_value={editData.validUntil}
          editable={false}
					maxLength={10}
					placeholderTextColor={colors.textColor}
          placeholder={String.fullDateFormat}
          rightAccessory={() => <Ionicons
            name="calendar-clear-sharp"
						color={colors.primary}
            onPress={openDatePicker}
            size={moderateScale(20)}
          />}
				/>
        <DateTimePicker
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={onConfirmDate}
          onCancel={onCancelDate}
        />
			</View>
			<CButton
				title={String.updateQr}
				frontIcon={<Ionicons
					name='qr-code'
					color={colors.white}
					size={moderateScale(30)}
					style={styles.mh10}
				/>}
				type={'B16'}
				containerStyle={localStyle.btnStyle}
        onPress={onUpdateQr}
			/>
		</CSafeAreaView>
	);
}

const localStyle = StyleSheet.create({
	container: {
		...styles.justifyBetween,
	},
	detailContainer: {
		borderRadius: moderateScale(12),
		borderWidth: moderateScale(1),
		...styles.p20,
		...styles.m20,
	},
	inputIcon: {
		width: moderateScale(25),
		height: moderateScale(25),
	},
	quoteText: {
		textAlign: 'right',
	},
	btnStyle: {
		width: '90%',
		...styles.selfCenter,
		...styles.mv30
	}
});