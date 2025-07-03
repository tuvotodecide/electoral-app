import {FlatList, StyleSheet, View} from 'react-native';
import React from 'react';

// custom import
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import String from '../../../i18n/String';
import LivePriceComponents from '../../../components/home/LivePriceComponents';
import {TopGrainersDetails} from '../../../api/constant';
import {styles} from '../../../themes';

export default function TopGrainers() {
  const topGrainer = ({item, index}) => {
    return <LivePriceComponents item={item} />;
  };
  return (
    <CSafeAreaView>
      <CHeader title={String.topGainers} />
      <View style={localStyle.mainContainer}>
        <FlatList
          data={TopGrainersDetails}
          renderItem={topGrainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.mb20}
        />
      </View>
    </CSafeAreaView>
  );
}

const localStyle = StyleSheet.create({
  mainContainer: {
    ...styles.ph20,
    ...styles.flex,
  },
});
