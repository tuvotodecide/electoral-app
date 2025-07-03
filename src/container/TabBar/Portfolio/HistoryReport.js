import {StyleSheet, View} from 'react-native';
import React, {useState} from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import WalletPreview from '../../../components/home/WalletPreview';
import {PortfolioHistoryReport} from '../../../api/constant';
import CButton from '../../../components/common/CButton';
import {styles} from '../../../themes';
import DownloadPortfolioPreview from '../../../components/modal/DownloadPortfolioPreview';
import {StackNav} from '../../../navigation/NavigationKey';

export default function HistoryReport({route, navigation}) {
  let items = route?.params?.items;
  const [isModalVisible, setIsModalVisible] = useState(false);

  const onPressDownloadPreview = () => {
    setIsModalVisible(!isModalVisible);
  };

  const onPressCancel = () => {
    setIsModalVisible(!isModalVisible);
  };
  const onPressDownload = () => {
    setIsModalVisible(!isModalVisible);
    navigation.goBack();
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.boughtCardano} />
      <WalletPreview
        data={PortfolioHistoryReport}
        image={items.image}
        titleText={'1,250 ADA'}
        transferValue={'105.00'}
      />
      <CButton
        title={String.download}
        type={'B16'}
        containerStyle={localStyle.downloadBtn}
        onPress={onPressDownloadPreview}
      />
      <DownloadPortfolioPreview
        visible={isModalVisible}
        onPressCancel={onPressCancel}
        onPressDownload={onPressDownload}
      />
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  downloadBtn: {
    ...styles.selfCenter,
    width: '90%',
  },
});
