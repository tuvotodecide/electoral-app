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

export default function NearbyMesasList({
  visible,
  loading,
  mesas,
  onSelect,
  onClose,
  colors,
}) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(mesas);

  useEffect(() => {
    setFiltered(
      mesas.filter(
        m =>
          m.numero.toLowerCase().includes(search.toLowerCase()) ||
          m.codigo.includes(search) ||
          m.colegio.toLowerCase().includes(search.toLowerCase()),
      ),
    );
  }, [search, mesas]);

  if (!visible) {
    return null;
  }
  return (
    <View style={[styles.container, {backgroundColor: colors.backgroundColor}]}>
      
      <View style={styles.searchBox}>
        <TextInput
          style={[styles.input, {color: colors.textColor}]}
          placeholder="Buscar mesa"
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
              style={styles.mesaItem}
              onPress={() => onSelect(item)}>
              <CText type="B16" color={colors.textColor}>
                {item.numero} - {item.colegio}
              </CText>
              <CText type="R12" color={colors.grayScale500}>
                Código: {item.codigo}
              </CText>
            </TouchableOpacity>
          )}
        />
      ) : (
        <CText type="R14" color={colors.grayScale500} style={styles.noResult}>
          No se encontraron mesas cercanas.
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
  mesaItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  noResult: {
    marginTop: 20,
    textAlign: 'center',
  },
});
