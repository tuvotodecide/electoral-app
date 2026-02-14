import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useState } from "react";

export const useBackupCheck = () => {
  const [hasBackup, setHasBackup] = useState(true);

  useFocusEffect(() => {
    const checkBackup = async () => {
      try {
        const backup = await AsyncStorage.getItem('account_backup');
        setHasBackup(!!backup);
      } catch (error) {
        console.error('Error checking backup:', error);
        setHasBackup(false);
      }
    }
    checkBackup();
  });

  const checkBackupAsStored = async () => {
    try {
      await AsyncStorage.setItem('account_backup', 'true');
      setHasBackup(true);
    } catch (error) {
      console.error('Error setting backup:', error);
      setHasBackup(false);
    }
  };

  return {hasBackup, checkBackupAsStored};
}