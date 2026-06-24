import String from '../../i18n/String';
import LoadingModal from '../../components/modal/LoadingModal';
import { captureError } from '../../config/sentry';
import wira from "wira-sdk";
import { BACKEND_IDENTITY } from '@env';
import { useEffect, useMemo, useState } from 'react';

export default function MigrationModal({
  userDid,
  pin
}) {
  const [modal, setModal] = useState({
    visible: false,
    message: '',
    isLoading: false,
  });
  const [migrationTried, setMigrationTried] = useState(false);
  const migrationService = useMemo(() => new wira.MigrationService(BACKEND_IDENTITY), []);

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
  
  const initMigration = async () => {
    if (!pin) {
      setModal({
        visible: true,
        message: String.migrationError,
        isLoading: false,
        success: false,
      });
      setMigrationTried(true);
      console.log('no pin')
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
      captureError(error, {
        critical: true,
        step: 'MigrationModal',
        flow: 'Migration',
      });
      setModal({
        visible: true,
        message: String.migrationError,
        isLoading: false,
        success: false,
      });
    } finally {
      setMigrationTried(true);
    }
  }

  const hideModal = () => {
    setModal({
      visible: false,
      message: '',
      isLoading: false,
    });
  }

  return (
    <LoadingModal
      {...modal}
      buttonText={migrationTried ? String.continue : String.migrateBackup}
      onClose={migrationTried ? hideModal : initMigration}
      secondBtn={!migrationTried ? undefined : modal.success ? undefined : String.retry}
      onSecondPress={initMigration}
    />
  );
}