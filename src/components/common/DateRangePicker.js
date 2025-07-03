// import React, {useState} from 'react';
// import {View, TouchableOpacity, Text, StyleSheet, Modal} from 'react-native';
// import DatePicker from 'react-native-date-picker';

// export default function DateRangePicker({
//   startDate,
//   endDate,
//   onStartChange,
//   onEndChange,
// }) {
//   const [openStart, setOpenStart] = useState(false);
//   const [openEnd, setOpenEnd] = useState(false);

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity
//         style={styles.dateInput}
//         onPress={() => setOpenStart(true)}>
//         <Text style={styles.dateText}>
//           {startDate ? startDate.toLocaleDateString() : 'Fecha inicio'}
//         </Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.dateInput}
//         onPress={() => setOpenEnd(true)}>
//         <Text style={styles.dateText}>
//           {endDate ? endDate.toLocaleDateString() : 'Fecha fin'}
//         </Text>
//       </TouchableOpacity>

//       {/* Modal para fecha inicio */}
//       <Modal transparent={true} animationType="slide" visible={openStart}>
//         <View style={styles.modalBackground}>
//           <View style={styles.modalContent}>
//             <DatePicker
//               mode="date"
//               date={startDate || new Date()}
//               onDateChange={onStartChange}
//               maximumDate={endDate || undefined} // No puede pasar la fecha fin
//             />
//             <TouchableOpacity
//               onPress={() => setOpenStart(false)}
//               style={styles.closeButton}>
//               <Text style={{color: 'blue'}}>Cerrar</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {/* Modal para fecha fin */}
//       <Modal transparent={true} animationType="slide" visible={openEnd}>
//         <View style={styles.modalBackground}>
//           <View style={styles.modalContent}>
//             <DatePicker
//               mode="date"
//               date={endDate || new Date()}
//               onDateChange={onEndChange}
//               minimumDate={startDate || undefined} // No puede ser antes que inicio
//             />
//             <TouchableOpacity
//               onPress={() => setOpenEnd(false)}
//               style={styles.closeButton}>
//               <Text style={{color: 'blue'}}>Cerrar</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//     marginVertical: 10,
//   },
//   dateInput: {
//     flex: 1,
//     padding: 10,
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   dateText: {
//     fontSize: 14,
//     color: '#333',
//   },
//   modalBackground: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.3)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 10,
//     padding: 20,
//   },
//   closeButton: {
//     marginTop: 10,
//     alignSelf: 'center',
//   },
// });
