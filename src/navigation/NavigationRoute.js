import CreateNewPassword from '../container/Auth/CreateNewPassword';
import CreatePin from '../container/Auth/CreatePin';
import FaceIdScreen from '../container/Auth/FaceIdScreen';
import FingerPrintScreen from '../container/Auth/FingerPrintScreen';
import Login from '../container/Auth/Login';
import OTPCode from '../container/Auth/OTPCode';
import SelectCountry from '../container/Auth/SelectCountry';
import SelectReason from '../container/Auth/SelectReason';
import SelfieWithIdCard from '../container/Auth/SelfieWithIdCard';
import SignUp from '../container/Auth/SignUp';
import SignUpWithMobileNumber from '../container/Auth/SignUpWithMobileNumber';
import SuccessfulPassword from '../container/Auth/SuccessfulPassword';
import UploadDocument from '../container/Auth/UploadDocument';
import UploadPhotoId from '../container/Auth/UploadPhotoId';
import VerifySuccess from '../container/Auth/VerifySuccess';
import Connect from '../container/Connect';
// import OnBoarding from '../container/OnBoarding';
import Splash from '../container/Splash';

// Pantallas de Voto
// import SubirActa from '../container/Voto/SubirActa';
import BuscarMesa from '../container/Voto/SubirActa/BuscarMesa';
import DetalleMesa from '../container/Voto/SubirActa/DetalleMesa';
import CameraScreen from '../container/Voto/SubirActa/CameraScreen';
import CameraPermissionTest from '../container/Voto/SubirActa/CameraPermissionTest';
import PhotoReviewScreen from '../container/Voto/SubirActa/PhotoReviewScreen';
import PhotoConfirmationScreen from '../container/Voto/SubirActa/PhotoConfirmationScreen';
import AtestiguarActa from '../container/Voto/AtestiguarActa/AtestiguarActa';
import CualEsCorrectaScreen from '../container/Voto/AtestiguarActa/CualEsCorrectaScreen';
import AnunciarConteo from '../container/Voto/AnunciarConteo/AnunciarConteo';
import BuscarMesaConteo from '../container/Voto/AnunciarConteo/BuscarMesaConteo';
import DetalleMesaConteo from '../container/Voto/AnunciarConteo/DetalleMesaConteo';
import MisAtestiguamientos from '../container/Voto/MisAtestiguamientos/MisAtestiguamientos';

import HomeScreen from '../container/TabBar/Home/HomeScreen';
import CryptoScreen from '../container/TabBar/Market/Crypto/CryptoScreen';
import MarketScreen from '../container/TabBar/Market/MarketScreen';
import NFTsScreen from '../container/TabBar/Market/NFTs/NFTsScreen';
import GoldScreen from '../container/TabBar/Market/Gold/GoldScreen';
import PortfolioScreen from '../container/TabBar/Portfolio/PortfolioScreen';
import Profile from '../container/TabBar/Profile/Profile';
import WalletScreen from '../container/TabBar/Wallet/WalletScreen';
import AuthNavigation from './type/AuthNavigation';
import TabNavigation from './type/TabNavigation';
import HomeStackNavigation from './type/HomeStackNavigation';
import SearchCryptoSort from '../container/TabBar/Market/Crypto/SearchCryptoSort';
import CryptoDetails from '../container/TabBar/Market/Crypto/CryptoDetails';
import PortfolioOfCrypto from '../container/TabBar/Market/Crypto/PortfolioOfCrypto';
import BuyCrypto from '../container/TabBar/Market/Crypto/BuyCrypto';
import ExchangeCrypto from '../container/TabBar/Market/Crypto/ExchangeCrypto';
import CryptoHistory from '../container/TabBar/Market/Crypto/CryptoHistory';
import MarketSectors from '../container/TabBar/Market/Stock/MarketSectors';
import SearchStocks from '../container/TabBar/Market/Stock/SearchStocks';
import DetailsStock from '../container/TabBar/Market/Stock/DetailsStock';
import BuyStock from '../container/TabBar/Market/Stock/BuyStock';
import ExchangeStock from '../container/TabBar/Market/Stock/ExchangeStock';
import PlaceBid from '../container/TabBar/Market/NFTs/PlaceBid';
import CollectionItem from '../container/TabBar/Market/NFTs/CollectionItem';
import ActivityNFts from '../container/TabBar/Market/NFTs/ActivityNFts';
import CollectionItemDetails from '../container/TabBar/Market/NFTs/CollectionItemDetails';
import CreatedByCollection from '../container/TabBar/Market/NFTs/CreatedByCollection';
import PersonalDetails from '../container/TabBar/Profile/PersonalDetails';
import BankAccount from '../container/TabBar/Profile/BankAccount';
import BankAccountDetails from '../container/TabBar/Profile/BankAccountDetails';
import AddBankAccount from '../container/TabBar/Profile/AddBankAccount';
import SelectLanguage from '../container/TabBar/Profile/SelectLanguage';
import PushNotification from '../container/TabBar/Profile/PushNotification';
import HelpCenter from '../container/TabBar/Profile/HelpCenter';
import FAQScreen from '../container/TabBar/Profile/FAQScreen';
import PrivacyPolicies from '../container/TabBar/Profile/PrivacyPolicies';
import ChangePinVerify from '../container/TabBar/Profile/ChangePinVerify';
import ChangePinNew from '../container/TabBar/Profile/ChangePinNew';
import ChangePinNewConfirm from '../container/TabBar/Profile/ChangePinNewConfirm';
import TermsAndCondition from '../container/TabBar/Profile/TermsAndCondition';
import ReferralCode from '../container/TabBar/Profile/ReferralCode';
import Notification from '../container/TabBar/Home/Notification';
import NotificationDetails from '../container/TabBar/Home/NotificationDetails';
import GoldDetails from '../container/TabBar/Market/Gold/GoldDetails';
import AutoInvestGold from '../container/TabBar/Market/Gold/AutoInvestGold';
import GoldLoan from '../container/TabBar/Market/Gold/GoldLoan';
import RedeemGold from '../container/TabBar/Market/Gold/RedeemGold';
import BuyGold from '../container/TabBar/Market/Gold/BuyGold';
import GoldHistory from '../container/TabBar/Market/Gold/GoldHistory';
import MyWalletDeposit from '../container/TabBar/Wallet/MyWalletDeposit';
import SelectBankAccountDeposit from '../container/TabBar/Wallet/SelectBankAccountDeposit';
import DepositPreview from '../container/TabBar/Wallet/DepositPreview';
import DepositSuccessful from '../container/TabBar/Wallet/DepositSuccessful';
import MyWalletWithdraw from '../container/TabBar/Wallet/MyWalletWithdraw';
import SelectBankAccountWithdraw from '../container/TabBar/Wallet/SelectBankAccountWithdraw';
import WithdrawSuccessful from '../container/TabBar/Wallet/WithdrawSuccessful';
import SendWallet from '../container/TabBar/Wallet/SendWallet';
import TransferBalance from '../container/TabBar/Wallet/TransferBalance';
import TransferPreview from '../container/TabBar/Wallet/TransferPreview';
import PortfolioHistory from '../container/TabBar/Portfolio/PortfolioHistory';
import AboutApp from '../container/TabBar/Profile/AboutApp';
import HistoryTransactionDetails from '../container/TabBar/Portfolio/HistoryTransactionDetails';
import HistoryReport from '../container/TabBar/Portfolio/HistoryReport';
import SellStock from '../container/TabBar/Market/Stock/SellStock';
import SellCrypto from '../container/TabBar/Market/Crypto/SellCrypto';
import StockHistory from '../container/TabBar/Market/Stock/StockHistory';
import StockPortfolio from '../container/TabBar/Market/Stock/StockPortfolio';
import StocksScreen from '../container/TabBar/Market/Stock/StocksScreen';
import WatchListHomeCard from '../container/TabBar/Home/WatchListHomeCard';
import StockFutures from '../container/TabBar/Market/Stock/StockFutures';
import TopGrainers from '../container/TabBar/Home/TopGrainers';
import SuccessfulInvest from '../container/TabBar/Market/Gold/SuccessfulInvest';
import RegisterUser1 from '../container/Auth/RegisterUser1';
import ConditionsRegister from '../container/register/ConditionsRegister';
import RegisterUser2 from '../container/Auth/RegisterUser2';
import RegisterUser3 from '../container/Auth/RegisterUser3';
import RegisterUser4 from '../container/Auth/RegisterUser4';
import RegisterUser5 from '../container/Auth/RegisterUser5';
import RegisterUser6 from '../container/Auth/RegisterUser6';
import RegisterUser7 from '../container/Auth/RegisterUser7';
import RegisterUser8 from '../container/Auth/RegisterUser8Pin';
import RegisterUser9 from '../container/Auth/RegisterUser9Pin';
import RegisterUser10 from '../container/Auth/RegisterUser10';
import RegisterUser11 from '../container/Auth/RegisterUser11';
import LoginUser from '../container/Auth/LoginUser';
import SelectRecuperation from '../container/Auth/SelectRecuperation';
import RecuperationQR from '../container/TabBar/Profile/RecuperationQR';
import Reward from '../container/TabBar/Profile/Reward';
import RewardCode from '../container/TabBar/Profile/RewardHistoryCode';
import RewardHistory from '../container/TabBar/Profile/RewardHistory';
import TransactionHistory from '../container/TabBar/Profile/TransactionHistory';
import TransactionItem from '../container/TabBar/Profile/TransactionItem';
import More from '../container/TabBar/More/More';
import Limit from '../container/TabBar/More/Limit';
import Privacy from '../container/TabBar/More/Privacy';
import Security from '../container/TabBar/More/Security';
import Suport from '../container/TabBar/More/Suport';
import Policy from '../container/TabBar/More/Policy';
import AccountLock from '../container/Auth/AccountLock';
import PurchaseTokens from '../container/TabBar/Purchase/PurchaseTokens';
import PurchaseDetails from '../container/TabBar/Purchase/PurchaseDetails';
import ReceiveWithQR from '../container/TabBar/Receive/ReceiveWithQR';
import ReceiveDetails from '../container/TabBar/Receive/ReceiveDetails';
import SendDetails from '../container/TabBar/Send/SendDetails';
import SendValidation from '../container/TabBar/Send/SendValidation';
import SendSuccess from '../container/TabBar/Send/SendSuccess';
import SendWithQR from '../container/TabBar/Send/SendWithQR';
import SendWithID from '../container/TabBar/Send/SendWithID';
import SendWithWallet from '../container/TabBar/Send/SendWithWallet';
import SendWalletHelp from '../container/TabBar/Send/SendWalletHelp';
import ReceiveTokenDetails from '../container/TabBar/Receive/ReceiveTokenDetails';
import Guardians from '../container/TabBar/Guardians/Guardians';
import GuardiansAdmin from '../container/TabBar/Guardians/GuardiansAdmin';
import AddGuardians from '../container/TabBar/Guardians/AddGuardians';

export const StackRoute = {
  Splash,
  AuthNavigation,
  TabNavigation,

  // Pantallas de Voto
  // SubirActa,
  BuscarMesa,
  DetalleMesa,
  CameraScreen,
  CameraPermissionTest,
  PhotoReviewScreen,
  PhotoConfirmationScreen,
  AtestiguarActa,
  CualEsCorrectaScreen,
  AnunciarConteo,
  BuscarMesaConteo,
  DetalleMesaConteo,
  MisAtestiguamientos,

  CryptoScreen,
  NFTsScreen,
  GoldScreen,
  StocksScreen,
  SearchCryptoSort,
  CryptoDetails,
  PortfolioOfCrypto,
  BuyCrypto,
  ExchangeCrypto,
  CryptoHistory,
  MarketSectors,
  SearchStocks,
  DetailsStock,
  StockPortfolio,
  BuyStock,
  ExchangeStock,
  StockHistory,
  PlaceBid,
  CollectionItem,
  ActivityNFts,
  CollectionItemDetails,
  CreatedByCollection,
  PersonalDetails,
  RecuperationQR,
  Reward,
  RewardCode,
  RewardHistory,
  Guardians,
  GuardiansAdmin,
  AddGuardians,
  TransactionHistory,
  TransactionItem,
  BankAccount,
  BankAccountDetails,
  AddBankAccount,
  SelectLanguage,
  PushNotification,
  HelpCenter,
  Limit,
  Privacy,
  Security,
  Suport,
  Policy,
  FAQScreen,
  PrivacyPolicies,
  ChangePinVerify,
  ChangePinNew,
  ChangePinNewConfirm,
  TermsAndCondition,
  ReferralCode,
  Notification,
  NotificationDetails,
  GoldDetails,
  AutoInvestGold,
  GoldLoan,
  RedeemGold,
  BuyGold,
  GoldHistory,
  MyWalletDeposit,
  SelectBankAccountDeposit,
  DepositPreview,
  DepositSuccessful,
  MyWalletWithdraw,
  SelectBankAccountWithdraw,
  WithdrawSuccessful,
  SendWallet,
  TransferBalance,
  TransferPreview,
  PortfolioHistory,
  AboutApp,
  HistoryTransactionDetails,
  HistoryReport,
  SellStock,
  SellCrypto,
  WatchListHomeCard,
  StockFutures,
  TopGrainers,
  SuccessfulInvest,
  PurchaseTokens,
  PurchaseDetails,
  ReceiveWithQR,
  ReceiveDetails,
  SendDetails,
  SendValidation,
  SendSuccess,
  SendWithQR,
  SendWithID,
  SendWithWallet,
  SendWalletHelp,
  ReceiveTokenDetails,
};

export const AuthRoute = {
  Connect,
  Login,
  SignUp,
  RegisterUser1,
  RegisterUser2,
  RegisterUser3,
  RegisterUser4,
  RegisterUser5,
  RegisterUser6,
  RegisterUser7,
  RegisterUser8,
  RegisterUser9,
  RegisterUser10,
  RegisterUser11,
  AccountLock,
  LoginUser,
  SelectRecuperation,
  ConditionsRegister,
  SignUpWithMobileNumber,
  OTPCode,
  CreateNewPassword,
  SuccessfulPassword,
  FaceIdScreen,
  FingerPrintScreen,
  SelectCountry,
  SelectReason,
  CreatePin,
  UploadDocument,
  UploadPhotoId,
  SelfieWithIdCard,
  VerifySuccess,
};

export const TabRoute = {
  HomeScreen: HomeStackNavigation,
  MarketScreen,
  PortfolioScreen,
  Profile,
  More,
  WalletScreen,
};
