// Mock para react-native FlatList
import React from 'react';

const FlatList = ({ data, renderItem, testID, keyExtractor, ...props }) => {
  if (!data || data.length === 0) {
    return React.createElement('FlatList', { testID, ...props });
  }

  const items = data.map((item, index) => {
    const key = keyExtractor ? keyExtractor(item, index) : index.toString();
    return renderItem({ item, index });
  });

  return React.createElement('ScrollView', { testID, ...props }, items);
};

export default {
  FlatList,
};
