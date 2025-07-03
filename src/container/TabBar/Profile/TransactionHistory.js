import React, {useState} from 'react';
import {FlatList, View} from 'react-native';

// custom imports
import CSafeAreaView from '../../../components/common/CSafeAreaView';
import CHeader from '../../../components/common/CHeader';
import KeyBoardAvoidWrapper from '../../../components/common/KeyBoardAvoidWrapper';
import {styles} from '../../../themes';
import CText from '../../../components/common/CText';
import CTransferRowCard from '../../../components/common/CTransferRowCard';
import CInput from '../../../components/common/CInput';
import {StackNav} from '../../../navigation/NavigationKey';
import CPagination from '../../../components/common/CPagination';
import String from '../../../i18n/String';

export default function TransactionHistory({navigation}) {
  const [filters, setFilters] = useState({
    moneda: '',
    accion: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({...prev, [key]: value}));
  };

  const onPressItem = () => {
    navigation.navigate(StackNav.TransactionItem);
  };

  const data = Array.from({length: 10}, (_, i) => ({
    id: i,
    leftTitle: i % 2 === 0 ? 'Enviado' : 'Recibido',
    leftSubtitle: i % 2 === 0 ? `A Usuario ${i}` : `De Usuario ${i}`,
    rightTitle: `${i % 2 === 0 ? '-' : ''}${Math.floor(
      Math.random() * 500,
    )} USDT`,
    rightSubtitle: `14/08/202${5 - (i % 3)}`,
    isSent: i % 2 === 0,
  }));

  const filteredData = data.filter(item => {
    const {moneda, accion} = filters;
    const matchMoneda =
      !moneda || item.rightTitle.toLowerCase().includes(moneda.toLowerCase());
    const matchAccion =
      !accion || accion.toLowerCase() === item.leftTitle.toLowerCase();
    return matchMoneda && matchAccion;
  });

  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const renderFilterInput = (label, key) => (
    <View style={{width: '48%'}}>
      <CInput
        label={label}
        _value={filters[key]}
        toGetTextFieldValue={val => handleFilterChange(key, val)}
      />
    </View>
  );

  return (
    <CSafeAreaView>
      <CHeader title="Historial de transacciones" />
      <KeyBoardAvoidWrapper contentContainerStyle={styles.ph20}>
        <CText type="B16" style={styles.boldText} marginTop={20}>
          {String.filtersLabel}
        </CText>

        <View style={[styles.flexRow, styles.wrap, styles.justifyBetween]}>
          {renderFilterInput(String.monedaLabel, 'moneda')}
          {renderFilterInput(String.accionLabel, 'accion')}
          {renderFilterInput(String.fechaInicioLabel, 'fechaInicio')}
          {renderFilterInput(String.fechaFinLabel, 'fechaFin')}
        </View>

        <FlatList
          data={paginatedData}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <CTransferRowCard {...item} onPress={onPressItem} />
          )}
          ListFooterComponent={
            <CPagination
              totalPages={Math.ceil(filteredData.length / pageSize)}
              currentPage={page}
              onPageChange={setPage}
            />
          }
        />
      </KeyBoardAvoidWrapper>
    </CSafeAreaView>
  );
}
