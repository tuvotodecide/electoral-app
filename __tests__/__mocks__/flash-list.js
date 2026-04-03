// Mock para @shopify/flash-list
import React from 'react';

const FlashList = ({ data, renderItem, testID, keyExtractor, ...props }) => {
  if (!data || data.length === 0) {
    return React.createElement('FlashList', { testID, ...props });
  }

  const items = data.map((item, index) => {
    const key = keyExtractor ? keyExtractor(item, index) : index.toString();
    return React.createElement('View', { key }, renderItem({ item, index }));
  });

  return React.createElement('ScrollView', { testID, ...props }, items);
};

export { FlashList };

export default {
  FlashList,
};
