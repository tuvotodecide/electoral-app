import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CPagination({totalPages, currentPage, onPageChange}) {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.container}>
      {Array.from({length: totalPages}, (_, i) => {
        const page = i + 1;
        const isActive = page === currentPage;
        return (
          <TouchableOpacity
            key={page}
            style={[styles.pageButton, isActive && styles.activePageButton]}
            onPress={() => onPageChange(page)}
            activeOpacity={0.7}>
            <Text style={[styles.pageText, isActive && styles.activePageText]}>
              {page}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 8,
  },
  pageButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  activePageButton: {
    backgroundColor: '#007AFF',
  },
  pageText: {
    fontSize: 14,
    color: '#555',
  },
  activePageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
