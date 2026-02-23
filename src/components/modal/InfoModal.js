import React from 'react';
import {Modal, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSelector} from 'react-redux';

import {styles} from '../../themes';
import {moderateScale} from '../../common/constants';
import CText from '../common/CText';
import CButton from '../common/CButton';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function InfoModal({
  visible,
  title,
  message,
  buttonText = 'OK',
  secondaryButtonText = '',
  closeCornerBtn = false,
  onClose,
  onSecondaryPress,
  testID = 'infoModal',
  onCloseCorner,
}) {
  const colors = useSelector(state => state.theme.theme);
  const handleCornerClose = onCloseCorner || onClose;
  const messageText = typeof message === 'string' ? message : String(message ?? '');

  const renderMessageWithBold = text => {
    const lines = String(text || '').split('\n');
    return lines.map((line, lineIndex) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
      return (
        <CText
          key={`info-modal-line-${lineIndex}`}
          testID={`${testID}MessageLine_${lineIndex}`}
          type="M16"
          align="center"
          style={lineIndex < lines.length - 1 ? base.messageLine : undefined}>
          {parts.map((part, partIndex) => {
            const boldMatch = part.match(/^\*\*(.*)\*\*$/);
            if (!boldMatch) return part;
            return (
              <CText
                key={`info-modal-part-${lineIndex}-${partIndex}`}
                type="M16"
                style={base.messageBold}>
                {boldMatch[1]}
              </CText>
            );
          })}
        </CText>
      );
    });
  };

  return (
    <Modal testID={testID} visible={visible} animationType="fade" transparent>
      <View testID={`${testID}Overlay`} style={[base.overlay, {backgroundColor: colors.modalBackground}]}>
        <View
          testID={`${testID}Container`}
          style={[base.container, {backgroundColor: colors.backgroundColor}]}>
          {title && (
            <CText testID={`${testID}Title`} type="B18" align="center" style={styles.mb20}>
              {title}
            </CText>
          )}
          <ScrollView
            testID={`${testID}ScrollView`}
            style={base.scroll}
            contentContainerStyle={{alignItems: 'center'}}
            showsVerticalScrollIndicator={true}>
            <View testID={`${testID}Message`}>{renderMessageWithBold(messageText)}</View>
          </ScrollView>
          {closeCornerBtn && 
            <TouchableOpacity style={base.closeButton} onPress={handleCornerClose}>
              <Ionicons name="close" size={24} color={colors.textColor} />
            </TouchableOpacity>
          }
          {secondaryButtonText ? (
            <View style={base.buttonRow}>
              <TouchableOpacity
                testID={`${testID}SecondaryButton`}
                style={base.secondaryButton}
                onPress={onSecondaryPress || onClose}>
                <CText type="M16" style={base.secondaryButtonText}>
                  {secondaryButtonText}
                </CText>
              </TouchableOpacity>
              <TouchableOpacity
                testID={`${testID}Button`}
                style={[base.primaryButton, {backgroundColor: colors.primary}]}
                onPress={onClose}>
                <CText type="M16" style={base.primaryButtonText}>
                  {buttonText}
                </CText>
              </TouchableOpacity>
            </View>
          ) : (
            <CButton
              testID={`${testID}Button`}
              title={buttonText}
              type="M16"
              containerStyle={base.button}
              onPress={onClose}
            />
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
    position: 'relative',
  },
  scroll: {
    maxHeight: moderateScale(200),
    marginBottom: moderateScale(10),
  },
  button: {
    width: '60%',
    marginTop: moderateScale(10),
  },
  buttonRow: {
    width: '100%',
    marginTop: moderateScale(10),
    flexDirection: 'row',
    columnGap: moderateScale(10),
  },
  secondaryButton: {
    flex: 1,
    minHeight: moderateScale(46),
    borderRadius: moderateScale(10),
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(8),
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    minHeight: moderateScale(46),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(8),
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  messageLine: {
    marginBottom: moderateScale(4),
  },
  messageBold: {
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
  },
});
