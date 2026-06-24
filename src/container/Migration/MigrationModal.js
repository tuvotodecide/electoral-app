import { ActivityIndicator, Modal, ScrollView, StyleSheet, View } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import { useSelector } from 'react-redux';

import String from '../../i18n/String';
import { captureError } from '../../config/sentry';
import wira from "wira-sdk";
import { BACKEND_IDENTITY, IDENTITY_KEY } from '@env';
import { moderateScale } from '../../common/constants';
import CText from '../../components/common/CText';
import CButton from '../../components/common/CButton';
import Icono from '../../components/common/Icono';
import { useEffect, useMemo, useState } from 'react';

export default function MigrationModal({
  userDid,
}) {
  const colors = useSelector(state => state.theme.theme);
  const [modal, setModal] = useState({
    visible: false,
    message: '',
    isLoading: false,
  });
  const [migrationTried, setMigrationTried] = useState(false);
  const [pin, setPin] = useState(null);
  const migrationService = useMemo(() => new wira.MigrationService(BACKEND_IDENTITY, IDENTITY_KEY), []);

  useEffect(() => {
    migrationService.checkMigration(userDid)
      .then((isMigrable) => {
        if (isMigrable) {
          setModal({
            visible: true,
            message: String.migrationModalDesc,
            isLoading: false,
          });
        }
      })
  }, [userDid, migrationService]);

  const onCodeFilled = (code) => {
    if (code.length === 4) {
      setPin(code);
      return;
    }

    setPin(null);
  };
  
  const initMigration = async () => {
    let shouldMarkMigrationTried = true;

    if (!pin) {
      setModal({
        visible: true,
        message: String.migrationError,
        isLoading: false,
        success: false,
      });
      setMigrationTried(true);
      return;
    }

    setModal({
      visible: true,
      message: String.migrationInProgress,
      isLoading: true,
    });

    try {
      await migrationService.startMigration(pin);
      setModal({
        visible: true,
        message: String.migrationSuccess,
        isLoading: false,
        success: true,
      });
    } catch (error) {
      const isInvalidPin = error?.message?.includes('Invalid PIN');

      captureError(error, {
        critical: true,
        step: 'MigrationModal',
        flow: 'Migration',
      });
      setModal({
        visible: true,
        message: isInvalidPin ? String.incorrectPinError : String.migrationError,
        isLoading: false,
        success: false,
      });

      if (isInvalidPin) {
        shouldMarkMigrationTried = false;
      }
    } finally {
      if (shouldMarkMigrationTried) {
        setMigrationTried(true);
      }
    }
  }

  const hideModal = () => {
    setModal({
      visible: false,
      message: '',
      isLoading: false,
    });
  }

  const isPrimaryDisabled = modal.isLoading || (!migrationTried && !pin);

  return (
    <Modal visible={modal.visible} animationType="fade" transparent>
      <View style={[base.overlay, { backgroundColor: colors.modalBackground }]}>
        <View style={[base.container, { backgroundColor: colors.backgroundColor }]}>
          <ScrollView
            style={base.scroll}
            contentContainerStyle={base.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {modal.isLoading ?
              <ActivityIndicator size="large" style={base.icon} />
              : modal.success ?
                <Icono name="check-circle" style={base.icon} color={colors.success} size={moderateScale(40)} />
                : <Icono name="account-alert" style={base.icon} color={colors.rejectedColor} size={moderateScale(40)} />
            }
            <CText type="M16" align="center">
              {modal.message}
            </CText>

            {!migrationTried && !modal.isLoading && (
              <>
                <CText type="M14" align="center" marginTop={moderateScale(20)}>
                  {String.enterPin}
                </CText>
                <OTPTextInput
                  testID="textInput"
                  inputCount={4}
                  containerStyle={base.otpInputViewStyle}
                  keyboardType="number-pad"
                  handleTextChange={onCodeFilled}
                  secureTextEntry={true}
                  editable
                  keyboardAppearance="dark"
                  placeholderTextColor={colors.textColor}
                  autoFocus={false}
                  textInputStyle={[
                    base.underlineStyleBase,
                    {
                      backgroundColor: colors.inputBackground,
                      color: colors.textColor,
                      borderColor: colors.grayScale500,
                    },
                  ]}
                  tintColor={colors.primary}
                  offTintColor={colors.grayScale500}
                />
              </>
            )}
          </ScrollView>

          {!modal.isLoading && (
            <>
              <CButton
                title={migrationTried ? String.continue : String.migrateBackup}
                testID="loadingModalCloseButton"
                disabled={isPrimaryDisabled}
                type="M16"
                containerStyle={base.button}
                onPress={migrationTried ? hideModal : initMigration}
              />
              {!!migrationTried && !modal.success && (
                <CButton
                  title={String.retry}
                  testID="loadingModalSecondButton"
                  type="M16"
                  containerStyle={[base.button, { backgroundColor: colors.grayScale200 }]}
                  textStyle={{ color: colors.textColor }}
                  disabled={!pin}
                  onPress={initMigration}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const base = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
  },
  scroll: {
    maxHeight: moderateScale(280),
    marginBottom: moderateScale(10),
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: moderateScale(20),
  },
  button: {
    width: '60%',
    marginTop: moderateScale(10),
  },
  otpInputViewStyle: {
    marginTop: moderateScale(10),
  },
  underlineStyleBase: {
    width: moderateScale(50),
    height: moderateScale(55),
    borderWidth: moderateScale(1),
    borderRadius: moderateScale(10),
    fontSize: moderateScale(26),
    fontWeight: '700',
    marginHorizontal: moderateScale(5),
  },
});