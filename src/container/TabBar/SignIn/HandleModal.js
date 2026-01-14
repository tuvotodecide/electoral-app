import { useEffect, useState } from "react";
import InfoModal from "../../../components/modal/InfoModal";
import {PROVIDER_NAME, BACKEND_IDENTITY} from '@env';
import wira from 'wira-sdk';
import String from "../../../i18n/String";
import { AuthNav } from "../../../navigation/NavigationKey";

const defaultModalState = {
  visible: false,
  title: '',
  message: '',
  buttonText: '',
  onClose: null,
};

const sharedSession = new wira.SharedSession(
  BACKEND_IDENTITY,
  PROVIDER_NAME
);

export function HandleModal({navigation}) {
  const [modal, setModal] = useState(defaultModalState);
  const [sharedUrl, setSharedUrl] = useState(null);

  useEffect(() => {
    sharedSession.handleShareResponse(
      setSharedUrl,
      onAcceptSharing,
      onDeclineSharing,
    );
  }, []);

  useEffect(() => {
    if(sharedUrl) {
      setModal({
        visible: true,
        title: String.sharedSessionTitle,
        message: String.sharedSessionMessage,
        buttonText: String.accept,
        onClose: () => handleCloseModal(true),
        closeCornerBtn: true,
        onCloseCorner: () => handleCloseModal(false),
      });
    }
  }, [sharedUrl]);

  const yieldUI = () => new Promise(resolve => setTimeout(resolve, 50));

  const handleCloseModal = async (accept) => {
    setModal(defaultModalState);
    await yieldUI();
    try {
      await sharedSession.onShareSession(sharedUrl, accept);
    } catch (error) {
      setModal({
        visible: true,
        title: String.error,
        message: error.message,
        buttonText: String.ok,
        onClose: () => setModal(defaultModalState),
      });
    } finally {
      setSharedUrl(null);
    }
  }

  const onAcceptSharing = async (id, salt) => {
    navigation.navigate(
      AuthNav.LoginUser,
      {
        sharedSessionId: id,
        sharedSessionSalt: salt,
      }
    )
  }

  const onDeclineSharing = async () => {
    setModal({
      visible: true,
      title: String.shareDeclined,
      message: String.shareDeclinedMessage,
      onClose: () => setModal(defaultModalState),
    });
  }

  return (
    <InfoModal {...modal} />
  );
}