const mockComponent = () => null;

const mockPaths = [
  '../../../src/container/Vote/common/ElectoralLocations',
  '../../../src/container/Vote/common/ElectoralLocationsSave',
  '../../../src/container/Vote/common/OfflinePendingScreen',
  '../../../src/container/Vote/common/SuccessScreen',
  '../../../src/container/Vote/common/UnifiedParticipationScreen',
  '../../../src/container/Vote/UnifiedTableScreen',
  '../../../src/container/Vote/UnifiedTableScreenUser',
  '../../../src/container/Vote/WitnessRecord/ActaDetailScreen',
  '../../../src/container/Auth/CreateNewPassword',
  '../../../src/container/Auth/CreatePin',
  '../../../src/container/Auth/FaceIdScreen',
  '../../../src/container/Auth/FingerPrintScreen',
  '../../../src/container/Auth/Login',
  '../../../src/container/Auth/OTPCode',
  '../../../src/container/Auth/SelectCountry',
  '../../../src/container/Auth/SelectReason',
  '../../../src/container/Auth/SelfieWithIdCard',
  '../../../src/container/Auth/SignUp',
  '../../../src/container/Auth/SignUpWithMobileNumber',
  '../../../src/container/Auth/SuccessfulPassword',
  '../../../src/container/Auth/UploadDocument',
  '../../../src/container/Auth/UploadPhotoId',
  '../../../src/container/Auth/VerifySuccess',
  '../../../src/container/Connect',
  '../../../src/container/OnBoarding',
  '../../../src/container/OnBoardingGuardians',
  '../../../src/container/Splash',
  '../../../src/container/TabBar/Recovery/FindMyUser',
  '../../../src/container/TabBar/Recovery/RecoveryUserQrpin',
  '../../../src/container/TabBar/Recovery/RecoveryUserQrpin2',
  '../../../src/container/TabBar/Recovery/RecoveryQR',
  '../../../src/container/TabBar/Recovery/RecoveryQr',
  '../../../src/container/TabBar/Recovery/MyGuardiansStatus',
  '../../../src/container/TabBar/Recovery/RecoveryUser1Pin',
  '../../../src/container/TabBar/Recovery/RecoveryUser2Pin',
  '../../../src/container/TabBar/Recovery/RecoveryFinalize',
  '../../../src/container/Vote/UploadRecord/SearchTable',
  '../../../src/container/Vote/UploadRecord/TableDetail',
  '../../../src/container/Vote/UploadRecord/CameraScreen',
  '../../../src/container/Vote/UploadRecord/CameraPermissionTest',
  '../../../src/container/Vote/UploadRecord/PhotoReviewScreen_new',
  '../../../src/container/Vote/UploadRecord/PhotoReviewScreen',
  '../../../src/container/Vote/UploadRecord/PhotoConfirmationScreen',
  '../../../src/container/Vote/WitnessRecord/WitnessRecord',
  '../../../src/container/Vote/WitnessRecord/WhichIsCorrectScreen',
  '../../../src/container/Vote/WitnessRecord/RecordReviewScreen',
  '../../../src/container/Vote/WitnessRecord/RecordCertificationScreen',
  '../../../src/container/Vote/AnnounceCount/AnnounceCount',
  '../../../src/container/Vote/AnnounceCount/SearchCountTable',
  '../../../src/container/Vote/AnnounceCount/CountTableDetail',
  '../../../src/container/Vote/MyWitnesses/MyWitnessesListScreen',
  '../../../src/container/Vote/MyWitnesses/MyWitnessesDetailScreen',
  '../../../src/container/TabBar/Profile/OracleParticipation',
  '../../../src/container/TabBar/Profile/Profile',
  '../../../src/container/TabBar/Profile/PersonalDetails',
  '../../../src/container/TabBar/Profile/SelectLanguage',
  '../../../src/container/TabBar/Profile/PushNotification',
  '../../../src/container/TabBar/Profile/HelpCenter',
  '../../../src/container/TabBar/Profile/FAQScreen',
  '../../../src/container/TabBar/Profile/PrivacyPolicies',
  '../../../src/container/TabBar/Profile/ChangePinVerify',
  '../../../src/container/TabBar/Profile/ChangePinNew',
  '../../../src/container/TabBar/Profile/ChangePinNewConfirm',
  '../../../src/container/TabBar/Profile/More',
  '../../../src/container/TabBar/Profile/Security',
  '../../../src/container/TabBar/Profile/TermsAndCondition',
  '../../../src/container/TabBar/Profile/RecuperationQR',
  '../../../src/container/TabBar/Home/Notification',
  '../../../src/container/TabBar/Home/NotificationDetails',
  '../../../src/container/Auth/RegisterUser1',
  '../../../src/container/register/ConditionsRegister',
  '../../../src/container/Auth/RegisterUser2',
  '../../../src/container/Auth/RegisterUser3',
  '../../../src/container/Auth/RegisterUser4',
  '../../../src/container/Auth/RegisterUser5',
  '../../../src/container/Auth/RegisterUser6',
  '../../../src/container/Auth/RegisterUser7',
  '../../../src/container/Auth/RegisterUser8Pin',
  '../../../src/container/Auth/RegisterUser9Pin',
  '../../../src/container/Auth/RegisterUser10',
  '../../../src/container/Auth/RegisterUser11',
  '../../../src/container/Auth/LoginUser',
  '../../../src/container/Auth/SelectRecuperation',
  '../../../src/container/Auth/AccountLock',
  '../../../src/container/TabBar/Guardians/Guardians',
  '../../../src/container/TabBar/Guardians/GuardiansAdmin',
  '../../../src/container/TabBar/Guardians/AddGuardians',
  '../../../src/container/TabBar/SignIn/FindSession',
  '../../../src/navigation/type/AuthNavigation',
  '../../../src/navigation/type/TabNavigation',
  '../../../src/navigation/type/HomeStackNavigation',
];

mockPaths.forEach((path) => {
  jest.doMock(path, () => mockComponent);
});

const {StackRoute, AuthRoute, TabRoute} = require('../../../src/navigation/NavigationRoute');
const {
  StackRoute: StackRouteClean,
  AuthRoute: AuthRouteClean,
  TabRoute: TabRouteClean,
} = require('../../../src/navigation/NavigationRouteClean');

describe('NavigationRoute', () => {

  it('expone rutas principales del stack', () => {
    expect(StackRoute.Splash).toBeDefined();
    expect(StackRoute.SearchTable).toBeDefined();
    expect(StackRoute.RecordReviewScreen).toBeDefined();
  });

  it('expone rutas de auth', () => {
    expect(AuthRoute.Login).toBeDefined();
    expect(AuthRoute.CreateNewPassword).toBeDefined();
    expect(AuthRoute.RecoveryFinalize).toBeDefined();
  });

  it('expone rutas del tab', () => {
    expect(TabRoute.HomeScreen).toBeDefined();
    expect(TabRoute.Profile).toBeDefined();
  });
});

describe('NavigationRouteClean', () => {
  it('expone rutas principales del stack', () => {
    expect(StackRouteClean.Splash).toBeDefined();
    expect(StackRouteClean.SearchTable).toBeDefined();
    expect(StackRouteClean.RecordCertificationScreen).toBeDefined();
  });

  it('expone rutas de auth', () => {
    expect(AuthRouteClean.Login).toBeDefined();
    expect(AuthRouteClean.UploadPhotoId).toBeDefined();
    expect(AuthRouteClean.RecoveryUserQrpin2).toBeDefined();
  });

  it('expone rutas del tab', () => {
    expect(TabRouteClean.HomeScreen).toBeDefined();
    expect(TabRouteClean.Profile).toBeDefined();
  });
});
