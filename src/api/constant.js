import { Platform } from 'react-native';
import images from '../assets/images';
import {
  AppleIcon,
  Apple_Dark,
  ChineseIcon,
  DigitalAccountIcon,
  DigitalAccount_Dark,
  DiscordIcon,
  DollarIcon,
  EspanolIcon,
  FrancaisIcon,
  GiftIcon,
  GoogleIcon,
  HelpCenter_Colord,
  IdentityCardIcon,
  IdentityCard_Dark,
  IdentityVerification_Dark,
  IdentityVerification_Light,
  IndonesiaIcon,
  ItalianoIcon,
  LockIcon,
  PassportIcon,
  Passport_Dark,
  PersonalProfile_Light,
  PrivacyPolicies_Dark,
  PrivacyPolicies_Light,
  Privacy_Dark,
  Privacy_Light,
  Profile_Dark,
  Profile_Light,
  Telegram_Blue,
  TermsAndCondition_Dark,
  TermsAndCondition_Light,
  UKFlagIcon,
  USFlagIcon,
  UkrainIcon,
  UrgauayIcon,
} from '../assets/svg';
import String from '../i18n/String';
import { StackNav} from '../navigation/NavigationKey';

export const OnBoardingData = [
  {
    id: 1,
    lightImage: images.OnBoardingImage1,
    darkImage: images.OnBoarding_Dark1,
    title: String.onBoardingTitleText1,
    description: String.onBoardingDescriptionText1,
  },
  {
    id: 2,
    lightImage: images.OnBoardingImage2,
    darkImage: images.OnBoarding_Dark2,
    title: String.onBoardingTitleText2,
    description: String.onBoardingDescriptionText2,
  },
  {
    id: 3,
    lightImage: images.OnBoardingImage3,
    darkImage: images.OnBoarding_Dark3,
    title: String.onBoardingTitleText3,
    description: String.onBoardingDescriptionText3,
  },
  {
    id: 4,
    lightImage: images.OnBoardingImage4,
    darkImage: images.OnBoarding_Dark4,
    title: String.onBoardingTitleText4,
    description: String.onBoardingDescriptionText4,
  },
  {
    id: 5,
    lightImage: images.OnBoardingImage5,
    darkImage: images.OnBoarding_Dark5,
    title: String.onBoardingTitleText5,
    description: String.onBoardingDescriptionText5,
  },
];

export const OnBoardingGuardiansData = [
  {
    id: 1,
    lightImage: images.OnBoardingGuardiansImage1,
    darkImage: images.OnBoardingGuardians_Dark1,
    title: String.onBoardingGuardiansTitleText1,
    description: String.onBoardingGuardiansDescriptionText1,
  },
  {
    id: 2,
    lightImage: images.OnBoardingGuardiansImage3,
    darkImage: images.OnBoardingGuardians_Dark3,
    title: String.onBoardingGuardiansTitleText2,
    description: String.onBoardingGuardiansDescriptionText2,
  },
  {
    id: 3,
    lightImage: images.SuccessfulDepositLight,
    darkImage: images.SuccessfulDepositDark,
    title: String.onBoardingGuardiansTitleText3,
    description: String.onBoardingGuardiansDescriptionText3,
  },
  {
    id: 4,
    lightImage: images.OnBoardingGuardiansImage5,
    darkImage: images.OnBoardingGuardians_Dark5,
    title: String.onBoardingGuardiansTitleText4,
    description: String.onBoardingGuardiansDescriptionText4,
  },
];

export const socialIcon = [
  {
    id: 1,
    svgDark: <Apple_Dark />,
    svgLight: <AppleIcon />,
    name: String.apple,
  },
  {
    id: 2,
    svgDark: <GoogleIcon />,
    svgLight: <GoogleIcon />,
    name: String.google,
  },
];

export const SelectCountryData = [
  {
    id: 1,
    svgIcon: <USFlagIcon />,
    countryName: String.unitedStates,
  },
  {
    id: 2,
    svgIcon: <UKFlagIcon />,
    countryName: String.unitedKingdom,
  },
  {
    id: 3,
    svgIcon: <UkrainIcon />,
    countryName: String.ukraine,
  },
  {
    id: 4,
    svgIcon: <UrgauayIcon />,
    countryName: String.uruguay,
  },
];

export const BankingData = [
  {
    id: 1,
    name: String.transfers,
  },
  {
    id: 2,
    name: String.schedulingPayments,
  },
  {
    id: 3,
    name: String.getSalaryEarly,
  },
  {
    id: 4,
    name: String.budgeting,
  },
  {
    id: 5,
    name: String.cashback,
  },
  {
    id: 6,
    name: String.viewAccountOnePlace,
  },
  {
    id: 7,
    name: String.viewAccountOnePlace,
    isLabel: true,
  },
];

export const InvestmentData = [
  {
    id: 7,
    name: String.investGold,
  },
  {
    id: 8,
    name: String.investCryptocurrency,
  },
  {
    id: 9,
    name: String.investStocks,
  },
  {
    id: 10,
    name: String.trading,
  },
  {
    id: 11,
    name: String.NFTs,
  },
];
export const GlobalSpendingData = [
  {
    id: 12,
    name: String.spendingAbroad,
  },
  {
    id: 13,
    name: String.travelInsurance,
  },
  {
    id: 14,
    name: String.hotelBooking,
  },
  {
    id: 15,
    name: String.foreignExchanges,
  },
];

export const UploadDocumentData = [
  {
    id: 1,
    isSelectIcon: <IdentityCard_Dark />,
    notSelectIcon: <IdentityCardIcon />,
    name: String.identityCard,
  },
  {
    id: 2,
    isSelectIcon: <DigitalAccount_Dark />,
    notSelectIcon: <DigitalAccountIcon />,
    name: String.myDigitalDocument,
  },
  {
    id: 3,
    isSelectIcon: <Passport_Dark />,
    notSelectIcon: <PassportIcon />,
    name: String.myPassport,
  },
];

export const FilterStatusData = [
  {
    id: 1,
    name: String.all,
  },
  {
    id: 2,
    name: String.buyNow,
  },
  {
    id: 3,
    name: String.openOffers,
  },
  {
    id: 4,
    name: String.liveAuctions,
  },
  {
    id: 5,
    name: String.notForSale,
  },
];

export const FilterTypeData = [
  {
    id: 6,
    name: String.multipleEditions,
  },
  {
    id: 7,
    name: String.singleEditions,
  },
];

export const ProfileDataV3 = [
  {
    section: String.moreConfig,
    data: [
      {
        id: 7,
        darkIcon: <Privacy_Dark />,
        lightIcon: <Privacy_Light />,
        title: String.moreConfig1Title,
        value: String.moreConfig2Subtitle,
        route: StackNav.Security,
      },
      // {
      //   id: 8,
      //   darkIcon: <TermsAndCondition_Dark />,
      //   lightIcon: <TermsAndCondition_Light />,
      //   title: String.moreConfig2Title,
      //   value: String.moreConfig2Subtitle,
      //   route: StackNav.Limit,
      // },
      // {
      //   id: 10,
      //   title: String.moreConfig3Title,
      //   icon: 'light-up',
      //   value: String.moreConfig3Subtitle,
      //   rightIcon: 'rightIcon',
      // },
    ],
  },
  {
    section: String.moreOthers,
    data: [
      // {
      //   id: 10,
      //   darkIcon: <HelpCenter_Dark />,
      //   lightIcon: <HelpCenter_Light />,
      //   title: String.moreOthers1Title,
      //   value: String.moreOthers1Subtitle,
      //   route: StackNav.Suport,
      // },
      {
        id: 11,
        darkIcon: <TermsAndCondition_Dark />,
        lightIcon: <TermsAndCondition_Light />,
        title: String.moreOthers2Title,
        value: String.moreOthers2Subtitle,
        route: StackNav.TermsAndCondition,
      },
      {
        id: 12,
        darkIcon: <PrivacyPolicies_Dark />,
        lightIcon: <PrivacyPolicies_Light />,
        title: String.moreOthers3Title,
        value: String.moreOthers3Subtitle,
        route: StackNav.PrivacyPolicies,
      },
      // {
      //   id: 14,
      //   title: String.moreOthers4Title,
      //   value: String.moreOthers4Subtitle,
      //   icon: 'log-out',
      //   logOut: 'logOut',
      // },
    ],
  },
];

export const SecuryData = [
  {
    section: String.moreConfig,
    data: [
      {
        id: 7,
        darkIcon: <LockIcon />,
        lightIcon: <LockIcon />,
        title: String.security1Title,
        value: String.security1Subtitle,
        route: StackNav.ChangePinVerify,
      },

      // {
      //   id: 8,
      //   darkIcon: <IdentityCardIcon />,
      //   lightIcon: <IdentityCard_Dark />,

      //   title: String.security2Title,
      //   value: String.security2Subtitle,
      //   route: StackNav.Limit,
      // },

      // {
      //   id: 10,
      //   darkIcon: <Email_Dark />,
      //   lightIcon: <Email_Light />,
      //   title: String.security3Title,
      //   value: String.security3Subtitle,
      //   route: StackNav.Suport,
      // },
      {
        id: 10,
        darkIcon: <IdentityVerification_Dark />,
        lightIcon: <IdentityVerification_Light />,
        title: Platform.OS === 'ios' ? String.security4TitleIos : String.security4TitleAndroid,
        value: Platform.OS === 'ios' ? String.security4SubtitleIos : String.security4SubtitleAndroid,
        rightIcon: 'switch',
      },
    ],
  },
];

export const ProfileDataV2 = [
  {
    section: '',
    data: [
      {
        id: 1,
        darkIcon: <Profile_Dark />,
        lightIcon: <PersonalProfile_Light />,
        title: String.personalData,
        value: String.personalDataValue,
        route: StackNav.PersonalDetails,
      },
      {
        id: 2,
        darkIcon: <IdentityVerification_Dark />,
        lightIcon: <IdentityVerification_Light />,
        title: String.dataBackup,
        value: String.dataBackupValue,
        route: StackNav.RecuperationQR,
      },
      {
        id: 5,
        darkIcon: <LockIcon />,
        lightIcon: <LockIcon />,
        title: String.more,
        value: String.moresub,
        route: StackNav.More,
      },
      // {
      //   id: 4,
      //   darkIcon: <History_Dark />,
      //   lightIcon: <History_Light />,
      //   title: String.transactionHistory,
      //   value: String.transactionHistoryValue,
      //   route: StackNav.TransactionHistory,
      // },
      // {
      //   id: 2345,
      //   darkIcon: <GiftIcon />,
      //   lightIcon: <GiftIcon />,
      //   title: String.earnRewards,
      //   value: String.earnRewardsValue,
      //   route: StackNav.Reward,
      // },
    ],
  },
];

export const LanguageData = [
  {
    id: 1,
    lName: String.english,
    svgIcon: <USFlagIcon />,
  },
  {
    id: 2,
    lName: String.englishUk,
    svgIcon: <UKFlagIcon />,
  },
  {
    id: 3,
    lName: String.indonesia,
    svgIcon: <IndonesiaIcon />,
  },
  {
    id: 4,
    lName: String.espanol,
    svgIcon: <EspanolIcon />,
  },
  {
    id: 5,
    lName: String.francais,
    svgIcon: <FrancaisIcon />,
  },
  {
    id: 6,
    lName: String.italiano,
    svgIcon: <ItalianoIcon />,
  },
  {
    id: 7,
    lName: String.chinese,
    svgIcon: <ChineseIcon />,
  },
];

export const helpAndCenterData = [
  {
    id: 1,
    svgIcon: <DiscordIcon />,
    title: String.discords,
    description: String.discordOfficial,
  },
  {
    id: 2,
    svgIcon: <Telegram_Blue />,
    title: String.telegram,
    description: String.telegramOfficial,
  },
];

export const FaqData = [
  {
    id: 1,
    title: String.FaqQuestion1,
    description: String.FaqDescription,
  },
  {
    id: 2,
    title: String.FaqQuestion2,
    description: String.FaqDescription,
  },
  {
    id: 3,
    title: String.FaqQuestion3,
    description: String.FaqDescription,
  },
  {
    id: 4,
    title: String.FaqQuestion4,
    description: String.FaqDescription,
  },
];

export const SearchTopicsFaqs = [
  {
    id: 1,
    svgIcon: <HelpCenter_Colord />,
    title: String.gettingStarted,
  },
  {
    id: 2,
    svgIcon: <Profile_Light />,
    title: String.myAccount,
  },
  {
    id: 1,
    svgIcon: <DollarIcon />,
    title: String.deposit,
  },
  {
    id: 1,
    svgIcon: <GiftIcon />,
    title: String.gettingStarted,
  },
];

export const ShareReferralCodeMediaData = [
  {
    id: 1,
    name: 'copy-outline',
    title: String.copy,
  },
  {
    id: 2,
    name: 'logo-whatsapp',
    title: String.whatsapp,
  },
  {
    id: 3,
    name: 'logo-instagram',
    title: String.instagram,
  },
  {
    id: 4,
    name: 'menu',
    title: String.more,
  },
];

export const NotificationSortData = [
  {
    id: 1,
    title: String.allStatus,
  },
  {
    id: 2,
    title: String.alreadyRead,
  },
  {
    id: 3,
    title: String.unread,
  },
];

