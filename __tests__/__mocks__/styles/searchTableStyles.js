// Mock para createSearchTableStyles
const createSearchTableStyles = jest.fn(() => ({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 16,
  },
  locationInfo: {
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  tablesList: {
    flex: 1,
  },
  tableItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
}));

export { createSearchTableStyles };