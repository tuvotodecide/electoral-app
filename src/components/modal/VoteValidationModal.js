import React from 'react';
import {Modal, StyleSheet, TouchableOpacity, View} from 'react-native';
import {moderateScale} from '../../common/constants';
import CText from '../common/CText';

export default function VoteValidationModal({
  visible,
  title = 'Revisa los votos',
  message,
  buttonText = 'Entendido',
  onClose,
  testID = 'voteValidationModal',
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" testID={testID}>
      <View testID={`${testID}Overlay`} style={styles.overlay}>
        <View testID={`${testID}Container`} style={styles.container}>
          <View style={styles.iconWrap}>
            <CText style={styles.iconText}>!</CText>
          </View>
          <CText testID={`${testID}Title`} style={styles.title}>
            {title}
          </CText>
          <CText testID={`${testID}Message`} style={styles.message}>
            {String(message || '')}
          </CText>
          <TouchableOpacity
            testID={`${testID}Button`}
            style={styles.button}
            onPress={onClose}>
            <CText style={styles.buttonText}>{buttonText}</CText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  container: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: moderateScale(18),
    paddingHorizontal: moderateScale(22),
    paddingVertical: moderateScale(24),
    alignItems: 'center',
  },
  iconWrap: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(12),
  },
  iconText: {
    color: '#B91C1C',
    fontSize: moderateScale(28),
    fontWeight: '800',
    lineHeight: moderateScale(30),
  },
  title: {
    color: '#B91C1C',
    fontSize: moderateScale(20),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: moderateScale(10),
  },
  message: {
    color: '#2F2F2F',
    fontSize: moderateScale(16),
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: moderateScale(22),
    marginBottom: moderateScale(18),
  },
  button: {
    minWidth: '72%',
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
});
