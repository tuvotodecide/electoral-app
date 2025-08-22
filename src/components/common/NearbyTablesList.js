import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  TextInput,
} from 'react-native';
import CText from './CText';

export default function NearbyTablesList({
  visible,
  loading,
  tables,
  onSelect,
  onClose,
  colors,
}) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(tables);

  useEffect(() => {
    setFiltered(
      tables.filter(
        table =>
          table.numero.toLowerCase().includes(search.toLowerCase()) ||
          table.codigo.includes(search) ||
          table.colegio.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [search, tables]);

  if (!visible) {
    return null;
  }
  return (
    <View style={[styles.container, {backgroundColor: colors.backgroundColor}]}>
      <View style={styles.searchBox}>
        <TextInput
          style={[styles.input, {color: colors.textColor}]}
          placeholder="Search table"
          placeholderTextColor={colors.grayScale500}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      ) : filtered.length > 0 ? (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.tableItem}
              onPress={() => onSelect(item)}>
              <CText type="B16" color={colors.textColor}>
                {item.numero} - {item.colegio}
              </CText>
              <CText type="R12" color={colors.grayScale500}>
                Code: {item.codigo}
              </CText>
            </TouchableOpacity>
          )}
        />
      ) : (
        <CText type="R14" color={colors.grayScale500} style={styles.noResult}>
          No nearby tables found.
        </CText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: 350,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  closeBtn: {
    marginLeft: 10,
  },
  searchBox: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
  },
  loader: {
    marginTop: 20,
  },
  tableItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noResult: {
    marginTop: 20,
    textAlign: 'center',
  },
});
