//import ElectoralLocations from '../container/Vote/Common/ElectoralLocations';
import ElectoralLocations from '../container/Vote/common/ElectoralLocations';
import OfflinePendingScreen from '../container/Vote/common/OfflinePendingScreen';
import UnifiedTableScreen from '../container/Vote/UnifiedTableScreen';
import ActaDetailScreen from '../container/Vote/WitnessRecord/ActaDetailScreen';
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
import OnBoarding from '../container/OnBoarding';
import OnBoardingGuardians from '../container/OnBoardingGuardians';
import Splash from '../container/Splash';
import FindMyUser from '../container/TabBar/Recovery/FindMyUser';
import RecoveryUserQrpin from '../container/TabBar/Recovery/RecoveryUserQrpin';
import RecoveryUserQrpin2 from '../container/TabBar/Recovery/RecoveryUserQrpin2';
//import RecoveryQr from '../container/TabBar/Recovery/RecoveryQr';
import RecoveryQr from '../container/TabBar/Recovery/RecoveryQr';
import MyGuardiansStatus from '../container/TabBar/Recovery/MyGuardiansStatus';
import RecoveryUser1Pin from '../container/TabBar/Recovery/RecoveryUser1Pin';
import RecoveryUser2Pin from '../container/TabBar/Recovery/RecoveryUser2Pin';
import RecoveryFinalize from '../container/TabBar/Recovery/RecoveryFinalize';

// Pantallas de Voto
import SearchTable from '../container/Vote/UploadRecord/SearchTable';
import TableDetail from '../container/Vote/UploadRecord/TableDetail';
import CameraScreen from '../container/Vote/UploadRecord/CameraScreen';
import CameraPermissionTest from '../container/Vote/UploadRecord/CameraPermissionTest';
import PhotoReviewScreen from '../container/Vote/UploadRecord/PhotoReviewScreen_new';
import PhotoConfirmationScreen from '../container/Vote/UploadRecord/PhotoConfirmationScreen';
import SuccessScreen from '../container/Vote/common/SuccessScreen';
import WitnessRecord from '../container/Vote/WitnessRecord/WitnessRecord';
import WhichIsCorrectScreen from '../container/Vote/WitnessRecord/WhichIsCorrectScreen';
import RecordReviewScreen from '../container/Vote/WitnessRecord/RecordReviewScreen';
import RecordCertificationScreen from '../container/Vote/WitnessRecord/RecordCertificationScreen';
import AnnounceCount from '../container/Vote/AnnounceCount/AnnounceCount';
import SearchCountTable from '../container/Vote/AnnounceCount/SearchCountTable';
import CountTableDetail from '../container/Vote/AnnounceCount/CountTableDetail';
import MyWitnessesListScreen from '../container/Vote/MyWitnesses/MyWitnessesListScreen';
import MyWitnessesDetailScreen from '../container/Vote/MyWitnesses/MyWitnessesDetailScreen';

// Nuevas pantallas
import UnifiedParticipationScreen from '../container/Vote/common/UnifiedParticipationScreen';
import OracleParticipation from '../container/TabBar/Profile/OracleParticipation';

// Componentes TabBar necesarios
import Profile from '../container/TabBar/Profile/Profile';
import AuthNavigation from './type/AuthNavigation';
import TabNavigation from './type/TabNavigation';
import HomeStackNavigation from './type/HomeStackNavigation';

// Profile screens necesarios
import PersonalDetails from '../container/TabBar/Profile/PersonalDetails';
import SelectLanguage from '../container/TabBar/Profile/SelectLanguage';
import PushNotification from '../container/TabBar/Profile/PushNotification';
import HelpCenter from '../container/TabBar/Profile/HelpCenter';
import FAQScreen from '../container/TabBar/Profile/FAQScreen';
import PrivacyPolicies from '../container/TabBar/Profile/PrivacyPolicies';
import ChangePinVerify from '../container/TabBar/Profile/ChangePinVerify';
import ChangePinNew from '../container/TabBar/Profile/ChangePinNew';
import ChangePinNewConfirm from '../container/TabBar/Profile/ChangePinNewConfirm';
import More from '../container/TabBar/Profile/More';
import Security from '../container/TabBar/Profile/Security';
import TermsAndCondition from '../container/TabBar/Profile/TermsAndCondition';
import RecuperationQR from '../container/TabBar/Profile/RecuperationQR';

// Home screens necesarios
import Notification from '../container/TabBar/Home/Notification';
import NotificationDetails from '../container/TabBar/Home/NotificationDetails';

// Auth adicionales
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
import AccountLock from '../container/Auth/AccountLock';

// Guardians
import Guardians from '../container/TabBar/Guardians/Guardians';
import GuardiansAdmin from '../container/TabBar/Guardians/GuardiansAdmin';
import AddGuardians from '../container/TabBar/Guardians/AddGuardians';

export const StackRoute = {
  ElectoralLocations,
  OfflinePendingScreen,
  UnifiedTableScreen,
  ActaDetailScreen,
  Splash,
  AuthNavigation,
  TabNavigation,

  // Pantallas de Voto
  SearchTable,
  TableDetail,
  CameraScreen,
  CameraPermissionTest,
  PhotoReviewScreen,
  PhotoConfirmationScreen,
  SuccessScreen,
  WitnessRecord,
  WhichIsCorrectScreen,
  RecordReviewScreen,
  RecordCertificationScreen,
  AnnounceCount,
  SearchCountTable,
  CountTableDetail,
  MyWitnessesListScreen,
  MyWitnessesDetailScreen,

  // Nuevas pantallas
  UnifiedParticipationScreen,
  OracleParticipation,

  // Profile y configuración
  PersonalDetails,
  RecuperationQR,
  Guardians,
  GuardiansAdmin,
  AddGuardians,
  SelectLanguage,
  PushNotification,
  HelpCenter,
  FAQScreen,
  PrivacyPolicies,
  ChangePinVerify,
  ChangePinNew,
  ChangePinNewConfirm,
  More,
  Security,

  TermsAndCondition,
  Notification,
  OnBoardingGuardians,
  NotificationDetails,
};

export const AuthRoute = {
  Connect,
  OnBoarding,
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
  FindMyUser,
  RecoveryUserQrpin,
  RecoveryUserQrpin2,
  RecoveryQr,
  MyGuardiansStatus,
  RecoveryUser1Pin,
  RecoveryUser2Pin,
  RecoveryFinalize,
};

export const TabRoute = {
  HomeScreen: HomeStackNavigation,
  Profile,
};
