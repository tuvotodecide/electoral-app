import images from '../assets/images';
import {
  AboutApp_Dark,
  AboutApp_Light,
  AppleIcon,
  Apple_Dark,
  AutoInvestIcon,
  AutoInvest_Dark,
  BankAmericaIcon,
  BankWallet_Dark,
  BankWallet_Light,
  BraclaysIcon,
  BusinessIcon,
  BuyAndSellIcon,
  CanadaIcon,
  ChineseIcon,
  CommunicationIcon,
  ConsumerIcon,
  CryptoIcon,
  Crypto_Dark,
  Crypto_Light,
  DepositIcon,
  DigitalAccountIcon,
  DigitalAccount_Dark,
  DiscordIcon,
  DollarIcon,
  Dollar_White,
  Email_Dark,
  Email_Light,
  EnergyIcon,
  EspanolIcon,
  FinanceIcon,
  FrancaisIcon,
  GiftIcon,
  GoldIcon,
  Gold_Dark,
  Gold_Light,
  GoogleIcon,
  GreenTickIcon,
  HealthCareIcon,
  HelpCenter_Colord,
  HelpCenter_Dark,
  HelpCenter_Light,
  History_Dark,
  History_Light,
  IdentityCardIcon,
  IdentityCard_Dark,
  IdentityVerification_Dark,
  IdentityVerification_Light,
  IndonesiaIcon,
  IndustryIcon,
  InformationIcon,
  ItalianoIcon,
  JapanIcon,
  Language_Dark,
  Language_Light,
  LoanIcon,
  LockIcon,
  MasterCardIcon,
  MaterialIcon,
  Mission_Dark,
  NFTIcon,
  NFTs_Dark,
  NFTs_Light,
  News_Dark,
  News_Light,
  PassportIcon,
  Passport_Dark,
  PayPalIcon,
  PersonalProfile_Light,
  PrivacyPolicies_Dark,
  PrivacyPolicies_Light,
  Privacy_Dark,
  Privacy_Light,
  Profile_Dark,
  Profile_Light,
  Promotion_Dark,
  Promotion_Light,
  PushNotification_Dark,
  PushNotification_Light,
  RealEstateIcon,
  ReceiveIcon,
  RedeemIcon,
  ReplaceIcon,
  SendIcon,
  StockIcon,
  Stock_Dark,
  Stock_Light,
  TabIcon,
  Tab_Light,
  TechnologyIcon,
  Telegram_Blue,
  Telegram_Dark,
  Telegram_Light,
  TermsAndCondition_Dark,
  TermsAndCondition_Light,
  UKFlagIcon,
  USFlagIcon,
  UkrainIcon,
  UrgauayIcon,
  UtilitiesIcon,
  VisaIcon,
  WellFegroIcon,
  WellsFargo,
  Whatsapp_Dark,
  Whatsapp_Light,
  WithdrawIcon,
} from '../assets/svg';
import {moderateScale} from '../common/constants';
import String from '../i18n/String';
import {AuthNav, StackNav} from '../navigation/NavigationKey';
import {colors} from '../themes/colors';

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
    onPress: () => console.log('apple'),
    name: String.apple,
  },
  {
    id: 2,
    svgDark: <GoogleIcon />,
    svgLight: <GoogleIcon />,
    onPress: () => console.log('google'),
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

export const financialCategoryData = [
  {
    id: 1,
    titleName: String.stock,
    svgIcon: <StockIcon />,
    route: StackNav.StockPortfolio,
  },
  {
    id: 2,
    titleName: String.crypto,
    svgIcon: <CryptoIcon />,
    route: StackNav.PortfolioOfCrypto,
  },
  {
    id: 3,
    titleName: String.NFTs,
    svgIcon: <NFTIcon />,
  },
  {
    id: 4,
    titleName: String.gold,
    svgIcon: <GoldIcon />,
  },
];

export const WatchlistData = [
  {
    id: 1,
    name: String.cryptoAssets,
  },
  {
    id: 2,
    name: String.uSStocks,
  },
  {
    id: 3,
    name: String.gold,
  },
  {
    id: 4,
    name: String.NFTs,
  },
];

export const CardData = [
  {
    id: 1,
    image: images.AirbnbImage,
    cardName: String.abab,
    bankName: String.airbnbInc,
    amount: String.amount1,
    profit: String.profit1,
    chartImage: images.ChartImage,
    upArrow: true,
  },
  {
    id: 2,
    image: images.SpotifyImage,
    cardName: String.spot,
    bankName: String.spotifyTechnology,
    amount: String.amount2,
    profit: String.profit2,
    chartImage: images.VectorChartImage,
  },
];

export const TopGrainersData = [
  {
    id: 1,
    image: images.PolygonImage,
    title: String.polygon,
    description: String.matic,
    amount: '$0.8016',
    profit: '5.87%',
  },
  {
    id: 2,
    image: images.BnbImage,
    title: String.bnb,
    description: String.bnbs,
    amount: '$271.01',
    profit: '1.68%',
  },
  {
    id: 3,
    image: images.SolanaImage,
    title: String.solana,
    description: String.sol,
    amount: '$31.02',
    profit: '4.80%',
  },
];

export const LatestNewsData = [
  {
    id: 1,
    image: images.CoinBaseImage,
    title: String.coinBaseText,
    time: '2h ago',
    newsType: String.theBlock,
  },
  {
    id: 2,
    image: images.EconomicTrashImage,
    title: String.economicText,
    time: '3h ago',
    newsType: String.financeNews,
  },
  {
    id: 3,
    image: images.CoinImage,
    title: String.coinText,
    time: '3h ago',
    newsType: String.theBlock,
  },
];

export const LatestNewsDataV2 = [];

export const MarketCategoryData = [
  {
    id: 1,
    title: String.cryptoAssets,
    svgDark: <Crypto_Dark />,
    svgLight: <Crypto_Light />,
  },
  {
    id: 2,
    title: String.uSStocks,
    svgDark: <Stock_Dark />,
    svgLight: <Stock_Light />,
  },
  {
    id: 1,
    title: String.NFTs,
    svgDark: <NFTs_Dark />,
    svgLight: <NFTs_Light />,
  },
  {
    id: 1,
    title: String.gold,
    svgDark: <Gold_Dark />,
    svgLight: <Gold_Light />,
  },
];

export const TrendingData = [
  {
    id: 1,
    image: images.ShibImage,
    title: String.shib,
    name: String.shibaInu,
    amount: '$0.09854',
    loss: '2.03%',
    upArrow: false,
    profitImage: images.VectorChartImage,
  },
  {
    id: 2,
    image: images.AdaImage,
    title: String.ada,
    name: String.cardano,
    amount: '$0.3391',
    profit: '0.95%',
    upArrow: true,
    profitImage: images.ChartImage,
  },
];

export const LivePriceData = [
  {
    id: 1,
    image: images.BitcoinImage,
    title: String.btc,
    name: String.bitcoin,
    amount: '$19,073.00',
    profit: '0.66%',
  },
  {
    id: 2,
    image: images.EthereumImage,
    title: String.eth,
    name: String.ethereum,
    amount: '$1,288.87',
    loss: '0.95%',
  },
  {
    id: 3,
    image: images.TetherImage,
    title: String.polygon,
    name: String.tether,
    amount: '$0,7869',
    loss: '0.03%',
  },
  {
    id: 4,
    image: images.UsdCoinImage,
    title: String.usdt,
    name: String.usdCoin,
    amount: '$1.00',
    profit: '0.66%',
  },
];
export const SearchLivePriceData = [
  {
    id: 1,
    image: images.BitcoinImage,
    title: String.btc,
    name: String.bitcoin,
    amount: '$19,073.00',
    profit: '0.66%',
  },
  {
    id: 2,
    image: images.EthereumImage,
    title: String.eth,
    name: String.ethereum,
    amount: '$1,288.87',
    loss: '0.95%',
  },
  {
    id: 3,
    image: images.TetherImage,
    title: String.polygon,
    name: String.tether,
    amount: '$0,7869',
    loss: '0.03%',
  },
  {
    id: 4,
    image: images.BnbImage,
    title: String.bnb,
    name: String.bnb,
    amount: '$269.75',
    profit: '0.03%',
  },
  {
    id: 5,
    image: images.UsdCoinImage,
    title: String.usdt,
    name: String.usdCoin,
    amount: '$1.00',
    profit: '0.66%',
  },
  {
    id: 6,
    image: images.BitcoinCashImage,
    title: String.bch,
    name: String.bitcoinCash,
    amount: '$108.98',
    loss: '0.13%',
  },
  {
    id: 7,
    image: images.BandProtocolImage,
    title: String.band,
    name: String.bandProtocol,
    amount: '$1.04',
    loss: '0.25%',
  },
];

export const CryptoTimeDetails = [
  {
    id: 1,
    time: '24H',
  },
  {
    id: 2,
    time: '1W',
  },
  {
    id: 3,
    time: '1M',
  },
  {
    id: 4,
    time: '1Y',
  },
  {
    id: 5,
    time: String.all,
  },
];

export const MarketStaticData = [
  {
    id: 1,
    title: String.open,
    value: '0.8321',
  },
  {
    id: 2,
    title: String.volume,
    value: '$220.00M',
  },
  {
    id: 3,
    title: String.high,
    value: '0.8393',
  },
  {
    id: 4,
    title: String.avgVol,
    value: '$57.19M',
  },
  {
    id: 5,
    title: String.low,
    value: '0.8151',
  },
  {
    id: 6,
    title: String.mktCap,
    value: '$7.831B',
  },
  {
    id: 7,
    title: String.wRange,
    value: '0.8322',
  },
  {
    id: 8,
    title: String.supply,
    value: '8.12B MATIC',
  },
];

export const PortfolioData = [
  {
    id: 1,
    svgIcon: <SendIcon />,
    title: String.send,
  },
  {
    id: 2,
    svgIcon: <ReceiveIcon />,
    title: String.receive,
  },
  {
    id: 3,
    svgIcon: <BuyAndSellIcon />,
    title: String.buySell,
    route: StackNav.BuyCrypto,
  },
  {
    id: 4,
    svgIcon: <ReplaceIcon />,
    title: String.exchange,
    route: StackNav.ExchangeCrypto,
  },
];

export const PortfolioCryptoData = [
  {
    id: 1,
    image: images.BitcoinImage,
    title: String.bitcoin,
    name: String.btc,
    amount: '0.678564 BTC',
    amountInDollar: '$13,029.46',
    profit: '0.35%',
  },
  {
    id: 2,
    image: images.PolygonImage,
    title: String.polygon,
    name: String.matic,
    amount: '1,300 MATIC',
    amountInDollar: '$1,084.55',
    loss: '0.10%',
  },
  {
    id: 3,
    image: images.SolanaImage,
    title: String.solana,
    name: String.sol,
    amount: '130.99 SOL',
    amountInDollar: '$3,672.28',
    profit: '0.10%',
  },
  {
    id: 4,
    image: images.AdaImage,
    title: String.cardano,
    name: String.ada,
    amount: '250 ADA',
    amountInDollar: '$87.69',
    profit: '2.50%',
  },
];

export const CryptoHistoryData = [
  {
    title: '20 October 2022',
    data: [
      {
        id: 1,
        image: images.AdaImage,
        title: String.sellAda,
        name: '04:00 PM',
        lossValue: ' -250',
        profit: '$87.69',
      },
      {
        id: 2,
        image: images.DiaImage,
        title: String.buyDai,
        name: '02:15 PM',
        amount: '+150',
        profit: '$149.98',
      },
      {
        id: 3,
        image: images.TetherImage,
        title: String.btcAndUsd,
        name: '10:12 AM',
        amount: '0.500',
        profit: '9.594',
      },
    ],
  },
  {
    title: '10 October 2022',
    data: [
      {
        id: 4,
        image: images.DollarImage,
        title: String.deposit,
        name: '07:00 PM',
        profitValue: '+ $234.00',
      },
      {
        id: 5,
        image: images.SolanaImage,
        title: String.buySol,
        name: '04:00 PM',
        amount: '+ 7.00',
        profit: '$196.47',
      },
      {
        id: 6,
        image: images.AdaImage,
        title: String.buyAda,
        name: '03:30 PM',
        amount: '+ 1000',
        profit: '$350.62',
      },
      {
        id: 7,
        image: images.DollarImage,
        title: String.deposit,
        name: '09:30 PM',
        profitValue: '+ $190.00',
      },
    ],
  },
];

export const StockFuturesData = [
  {
    id: 1,
    image: images.NASDImage,
    title: 'NASDAQ100',
    name: 'NASDAQ 100 Index',
    amount: '$111,73',
    profit: '2.56%',
    chartImage: images.whiteChartImage,
  },
  {
    id: 2,
    image: images.SPImage,
    title: 'SNP500',
    name: 'S&P 500 Index',
    amount: '$37,31',
    profit: '1.55%',
    chartImage: images.ChartImage,
  },
  {
    id: 3,
    image: images.NASDImage,
    title: 'NASDAQ100',
    name: 'NASDAQ 100 Index',
    amount: '$111,73',
    profit: '2.56%',
    chartImage: images.whiteChartImage,
  },
];

export const SectorsData = [
  {
    id: 1,
    svgIcon: <FinanceIcon />,
    titleName: String.finance,
  },
  {
    id: 2,
    svgIcon: <TechnologyIcon />,
    titleName: String.technology,
  },
  {
    id: 3,
    svgIcon: <IndustryIcon />,
    titleName: String.industry,
  },
  {
    id: 4,
    svgIcon: <UtilitiesIcon />,
    titleName: String.utilities,
  },
];

export const AllStocksData = [
  {
    id: 1,
    image: images.AmazonImage,
    title: String.amzn,
    name: String.amazonInc,
    amount: '$0,7869',
    loss: '0.12%',
  },
  {
    id: 2,
    image: images.AirbnbImage,
    title: String.abnb,
    name: String.airbnbInc,
    amount: '$112,72.00',
    profit: '0.33%',
  },
  {
    id: 3,
    image: images.ShopImage,
    title: String.shop,
    name: String.shopifyInc,
    amount: '$27,82.00',
    profit: '6.71%',
  },
];

export const TopMarketSectorData = [
  {
    id: 1,
    svgIcon: <FinanceIcon />,
    titleName: String.finance,
  },
  {
    id: 2,
    svgIcon: <TechnologyIcon />,
    titleName: String.technology,
  },
  {
    id: 3,
    svgIcon: <UtilitiesIcon />,
    titleName: String.utilities,
  },
];

export const AllMarketSectorsData = [
  {
    id: 4,
    svgIcon: <BusinessIcon />,
    titleName: String.business,
  },
  {
    id: 5,
    svgIcon: <EnergyIcon />,
    titleName: String.energy,
  },
  {
    id: 6,
    svgIcon: <HealthCareIcon />,
    titleName: String.healthcare,
  },
  {
    id: 7,
    svgIcon: <RealEstateIcon />,
    titleName: String.realEstate,
  },
  {
    id: 8,
    svgIcon: <ConsumerIcon />,
    titleName: String.consumer,
  },
  {
    id: 9,
    svgIcon: <CommunicationIcon />,
    titleName: String.communication,
  },
  {
    id: 10,
    svgIcon: <FinanceIcon />,
    titleName: String.finance,
  },
  {
    id: 11,
    svgIcon: <TechnologyIcon />,
    titleName: String.technology,
  },
  {
    id: 12,
    svgIcon: <IndustryIcon />,
    titleName: String.industry,
  },
  {
    id: 13,
    svgIcon: <MaterialIcon />,
    titleName: String.materials,
  },
  {
    id: 14,
    svgIcon: <UtilitiesIcon />,
    titleName: String.utilities,
  },
  {
    id: 15,
    svgIcon: <InformationIcon />,
    titleName: String.information,
  },
];

export const SearchStockData = [
  {
    id: 1,
    image: images.AppleImage,
    title: String.aapl,
    name: String.appleInc,
    amount: '$145,19.00',
    profit: '3.10%',
  },
  {
    id: 2,
    image: images.AirbnbImage,
    title: String.abnb,
    name: String.airbnbInc,
    amount: '$112,72.00',
    profit: '0.33%',
  },
  {
    id: 3,
    image: images.AmazonImage,
    title: String.amzn,
    name: String.amazonInc,
    amount: '$112,85.00',
    profit: '0.33%',
  },
  {
    id: 4,
    image: images.AmdImage,
    title: String.amd,
    name: String.advanceMicroDevices,
    amount: '$57,46',
    loss: '0.90%',
  },
];

export const MarketStockData = [
  {
    id: 1,
    title: String.open,
    value: '119.00',
  },
  {
    id: 2,
    title: String.volume,
    value: '$43.00M',
  },
  {
    id: 3,
    title: String.high,
    value: '115.00',
  },
  {
    id: 4,
    title: String.avgVol,
    value: '$57.19M',
  },
  {
    id: 5,
    title: String.low,
    value: '110.00',
  },
  {
    id: 6,
    title: String.mktCap,
    value: '$1.118B',
  },
  {
    id: 7,
    title: String.wRange,
    value: '101-188',
  },
  {
    id: 8,
    title: String.supply,
    value: '98.85',
  },
];

export const StockAssetsData = [
  {
    id: 1,
    image: images.AmazonImage,
    title: String.amzn,
    name: String.amazonInc,
    chartImage: images.ChartImage,
    shares: '10 Shares',
    gainLoss: String.gainLoss,
    amount: '$4,987.00',
    profit: '+$1,897.00',
  },
  {
    id: 2,
    image: images.AirbnbImage,
    title: String.abnb,
    name: String.airbnbInc,
    chartImage: images.VectorChartImage,
    shares: '5 Shares',
    gainLoss: String.gainLoss,
    amount: '$2,432.00',
    loss: '-$562.00',
  },
  {
    id: 3,
    image: images.AmdImage,
    title: String.amd,
    name: String.advanceMicroDevices,
    chartImage: images.ChartImage,
    shares: '2 Shares',
    gainLoss: String.gainLoss,
    amount: '$987.00',
    profit: '+$56.00',
  },
];
export const PortfolioStockData = [
  {
    id: 1,
    svgIcon: <SendIcon />,
    title: String.send,
  },
  {
    id: 2,
    svgIcon: <ReceiveIcon />,
    title: String.receive,
  },
  {
    id: 3,
    svgIcon: <BuyAndSellIcon />,
    title: String.buySell,
    route: StackNav.BuyStock,
  },
  {
    id: 4,
    svgIcon: <ReplaceIcon />,
    title: String.exchange,
    route: StackNav.ExchangeStock,
  },
];

export const StockHistoryData = [
  {
    title: '20 October 2022',
    data: [
      {
        id: 1,
        image: images.AmazonImage,
        title: String.buyAMZN,
        name: '04:00 PM',
        amount: ' $224.90',
        profit: ' +2.00',
      },
      {
        id: 2,
        image: images.DollarImage,
        title: String.deposit,
        name: '04:00 PM',
        profitValue: '+ $234.00',
      },
      {
        id: 3,
        image: images.AmdImage,
        title: String.buyAmd,
        name: '02:15 PM',
        amount: '$172.38',
        profit: '+ 3.00',
      },
    ],
  },
  {
    title: '10 October 2022',
    data: [
      {
        id: 4,
        image: images.SendImage,
        title: String.sendAmzn,
        name: '07:00 PM',
        amount: '$224.90',
        profit: '- 2.00',
      },
      {
        id: 5,
        image: images.AppleImage,
        title: String.buyAppl,
        name: '04:00 PM',
        amount: '$1,016.33',
        profit: '+ 7.00',
      },
      {
        id: 6,
        image: images.DollarImage,
        title: String.deposit,
        name: '09:30 PM',
        profitValue: '+ $190.00',
      },
    ],
  },
];

export const hotCollectionData = [
  {
    id: 1,
    title: String.nemusGenesis,
    image: images.NemusImage,
    itemNo: 1,
    price: '$95,987.00',
    route: StackNav.CollectionItem,
    svgIcon: (
      <GreenTickIcon width={moderateScale(20)} height={moderateScale(20)} />
    ),
  },
  {
    id: 2,
    title: String.storiesFrom,
    image: images.StoriesImage,
    itemNo: 2,
    price: '$67,453.00',
    route: StackNav.CollectionItem,
    svgIcon: <GreenTickIcon />,
  },
  {
    id: 3,
    title: String.crystalDo,
    image: images.CrystalImage,
    itemNo: 3,
    price: '$57,543.00',
    route: StackNav.CollectionItem,
    svgIcon: <GreenTickIcon />,
  },
  {
    id: 4,
    title: String.expressions,
    image: images.ExpressionImage,
    itemNo: 4,
    price: '$48,123.00',
    route: StackNav.CollectionItem,
    svgIcon: <GreenTickIcon />,
  },
];

export const HotBidsData = [
  {
    id: 1,
    image: images.HotBidsImage1,
    title: String.codexxx,
    name: String.liquidRuminations,
    priceText: String.price,
    current: String.currentBid,
    price: '0.029 ETH',
    currentBid: '0.019 ETH',
    svgIcon: <GreenTickIcon />,
  },
  {
    id: 2,
    image: images.HotBidsImage2,
    title: String.nemusGenesis,
    name: String.genesisArtikulugis,
    priceText: String.price,
    current: String.currentBid,
    price: '0.500 ETH',
    currentBid: '0.450 ETH',
    svgIcon: <GreenTickIcon />,
  },
];

export const historyOfBidData = [
  {
    id: 1,
    image: images.HistoryPlaceBidImage1,
    userName: String.krishnaBarbe,
    expiration: String.expiration,
    ethValue: '0.450 ETH',
  },
  {
    id: 2,
    image: images.HistoryPlaceBidImage2,
    userName: String.aileenFullbright,
    expiration: String.expiration,
    ethValue: '0.315 ETH',
  },
];

export const CollectionItemData = [
  {
    id: 1,
    images: images.HotBidsImage2,
    userName: String.nemusGenesis,
    svgIcon: <GreenTickIcon />,
    name: String.genesisArtikulugis,
    priceText: String.price,
    current: String.currentBid,
    price: '0.500 ETH',
    currentBid: '0.450 ETH',
  },
  {
    id: 2,
    images: images.CollectionItemImage2,
    userName: String.nemusGenesis,
    svgIcon: <GreenTickIcon />,
    name: 'Genesis #0011',
    priceText: String.price,
    current: String.currentBid,
    price: '0.100 ETH',
    currentBid: '0.096 ETH',
  },
  {
    id: 3,
    images: images.CollectionItemImage3,
    userName: String.nemusGenesis,
    svgIcon: <GreenTickIcon />,
    name: 'Genesis #0012',
    priceText: String.price,
    current: String.currentBid,
    price: '0.250 ETH',
    currentBid: '0.190 ETH',
  },
  {
    id: 4,
    images: images.CollectionItemImage4,
    userName: String.nemusGenesis,
    svgIcon: <GreenTickIcon />,
    name: 'Genesis Artiku #01',
    priceText: String.price,
    current: String.currentBid,
    price: '0.500 ETH',
    currentBid: '0.450 ETH',
  },
  {
    id: 5,
    images: images.CollectionItemImage5,
    userName: String.nemusGenesis,
    svgIcon: <GreenTickIcon />,
    name: 'Genesis #0013',
    priceText: String.price,
    current: String.currentBid,
    price: '0.090 ETH',
    currentBid: '0.050 ETH',
  },
  {
    id: 6,
    images: images.CollectionItemImage6,
    userName: String.nemusGenesis,
    svgIcon: <GreenTickIcon />,
    name: 'Genesis Artiku #02',
    priceText: String.price,
    current: String.currentBid,
    price: '0.100 ETH',
    currentBid: '0.083 ETH',
  },
];

export const ActivityData = [
  {
    id: 1,
    image: images.CollectionItemImage4,
    title: String.genesisArtikulugis,
    name: String.sale,
    amount: ' 0.450 ETH',
    time: '2m ago',
  },
  {
    id: 2,
    image: images.HotBidsImage2,
    title: String.genesisArtikulugis,
    name: String.sale,
    amount: ' 0.450 ETH',
    time: '3m ago',
  },
  {
    id: 3,
    image: images.CollectionItemImage3,
    title: 'Genesis #0012',
    name: String.sale,
    amount: '0.190 ETH',
    time: '3m ago',
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

export const CollectionItemDetailsData = [
  {
    id: 1,
    image: images.NemusImage,
    title: String.highestFloorBid,
    name: String.pixxipawntool,
    value: '0.450 ETH',
  },
];

export const SpacyBoxUserDetails = [
  {
    id: 1,
    title: String.followers,
    value: '45.5K',
  },
  {
    id: 2,
    title: String.following,
    value: '900',
  },
  {
    id: 3,
    title: String.created,
    value: '12.5K',
  },
];

export const ProfileData = [
  {
    section: String.accountDetails,
    data: [
      {
        id: 1,
        darkIcon: <Profile_Dark />,
        lightIcon: <PersonalProfile_Light />,
        title: String.personalDetails,
        value: String.yourAccountInformation,
        route: StackNav.PersonalDetails,
      },
      {
        id: 2,
        darkIcon: <IdentityVerification_Dark />,
        lightIcon: <IdentityVerification_Light />,
        title: String.identifyVerification,
        value: String.yourVerificationStatus,
      },
      {
        id: 3,
        darkIcon: <History_Dark />,
        lightIcon: <History_Light />,
        title: String.transactionHistory,
        value: String.yourTransactionDetails,
      },
      {
        id: 4,
        darkIcon: <BankWallet_Dark />,
        lightIcon: <BankWallet_Light />,
        title: String.bankAccount,
        value: String.manageYourBankAccount,
        route: StackNav.BankAccount,
      },
    ],
  },
  {
    section: String.features,
    data: [
      {
        id: 5,
        darkIcon: <Mission_Dark />,
        lightIcon: <Mission_Dark />,
        title: String.mission,
        value: String.getMoreRewards,
      },
      {
        id: 6,
        darkIcon: <AutoInvest_Dark />,
        lightIcon: <AutoInvest_Dark />,
        title: String.autoInvest,
        value: String.manageAutoInvestment,
      },
    ],
  },
  {
    section: String.settings,
    data: [
      {
        id: 7,
        darkIcon: <Privacy_Dark />,
        lightIcon: <Privacy_Light />,
        title: String.privacySecurity,
        value: String.pinBiometricProtection,
      },
      {
        id: 8,
        darkIcon: <PushNotification_Dark />,
        lightIcon: <PushNotification_Light />,
        title: String.pushNotifications,
        value: String.notificationPreferences,
        route: StackNav.PushNotification,
      },
      {
        id: 9,
        darkIcon: <Language_Dark />,
        lightIcon: <Language_Light />,
        title: String.language,
        value: String.english,
        route: StackNav.SelectLanguage,
      },
      {
        id: 10,
        title: String.darkMode,
        icon: 'light-up',
        value: String.darkModeValue,
        rightIcon: 'rightIcon',
      },
    ],
  },
  {
    section: String.others,
    data: [
      {
        id: 10,
        darkIcon: <HelpCenter_Dark />,
        lightIcon: <HelpCenter_Light />,
        title: String.helpCenter,
        value: String.getSupports,
        route: StackNav.HelpCenter,
      },
      {
        id: 11,
        darkIcon: <TermsAndCondition_Dark />,
        lightIcon: <TermsAndCondition_Light />,
        title: String.termsConditions,
        value: String.ourTermsConditions,
        route: StackNav.TermsAndCondition,
      },
      {
        id: 12,
        darkIcon: <PrivacyPolicies_Dark />,
        lightIcon: <PrivacyPolicies_Light />,
        title: String.privacyPolicy,
        value: String.ourPrivacyPolicy,
        route: StackNav.PrivacyPolicies,
      },
      {
        id: 13,
        darkIcon: <AboutApp_Dark />,
        lightIcon: <AboutApp_Light />,
        title: String.aboutApp,
        value: String.ourApplication,
        route: StackNav.AboutApp,
      },
      {
        id: 14,
        title: String.logOut,
        icon: 'log-out',
        logOut: 'logOut',
      },
    ],
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
        title: String.security4Title,
        value: String.security4Subtitle,
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
        title: String.qrBackup,
        value: String.qrBackupValue,
        route: StackNav.RecuperationQR,
      },
      {
        id: 3,
        darkIcon: <Privacy_Dark />,
        lightIcon: <Privacy_Light />,
        title: String.guardians,
        value: String.guardiansValue,
        route: StackNav.Guardians,
      },
      {
        id: 4,
        darkIcon: <Privacy_Dark />,
        lightIcon: <Privacy_Light />,
        title: String.myProtected,
        value: String.protectedValue,
        route: StackNav.GuardiansAdmin,
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

export const BankAccountData = [
  {
    title: String.bankAccount,
    data: [
      {
        id: 1,
        svgIcon: <BankAmericaIcon />,
        title: String.bankOfAmerica,
        value: '**** **** **** 8907',
        userName: String.helenaSarapova,
        expiryDate: '12/2024',
      },
      {
        id: 2,
        svgIcon: <BraclaysIcon />,
        title: String.barclays,
        value: '**** **** **** 8907',
        userName: String.helenaSarapova,
        expiryDate: '12/2024',
      },
    ],
  },
  {
    title: String.eWallet,
    data: [
      {
        id: 3,
        svgIcon: <PayPalIcon />,
        title: String.paypal,
        value: 'helenasarapova@mail.com',
        userName: String.helenaSarapova,
        expiryDate: '12/2024',
      },
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

export const PrivacyPOliciesData = [
  {
    id: 1,
    title: null,
    description: String.privacyPoliciesText,
  },
  {
    id: 2,
    title: String.ourCommitment,
    description: String.commitmentText,
  },
  {
    id: 3,
    title: String.scopeAndApproval,
    description: String.scopeAndApprovalText1,
    description2: String.scopeAndApprovalText2,
  },
];
export const TermsAndConditionData = [
  {
    id: 1,
    description: String.termsAndCondition1,
  },
  {
    id: 2,
    description: String.termsAndCondition2,
  },
  {
    id: 3,
    description: String.termsAndCondition3,
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

export const NotificationData = [
  {
    id: 1,
    image: images.EmailImage,
    title: String.emailVerified,
    value: String.yourEmailHasBeenVerified,
    time: '12:00 PM',
    isDark: false,
  },
  {
    id: 2,
    image: images.AmdImage,
    title: String.priceAlert,
    value: String.amdCurrentPriceIs + ' $24.00',
    isDark: true,
    time: '10:13 AM',
  },
  {
    id: 3,
    image: images.AdaImage,
    title: String.priceAlert,
    value: String.adaCurrentPriceIs + ' $0.3190',
    isDark: false,
    time: '10:12 PM',
  },
  {
    id: 4,
    image: images.DollarImage,
    title: String.depositUSDSuccessful,
    value: String.youHaveSuccessfullyDeposited,
    isDark: true,
    time: 'Oct 31',
  },
  {
    id: 5,
    image: images.AmazonImage,
    title: String.priceAlert,
    value: String.amznCurrentPriceIs,
    isDark: false,
    time: 'Oct 29',
  },
  {
    id: 6,
    image: images.SolanaImage,
    title: String.successfullyBoughtSOL,
    value: String.youHaveSuccessfullyPurchasedSOL,
    isDark: false,
    time: 'Oct 15',
  },
  {
    id: 7,
    image: images.AirbnbImage,
    title: String.successfullyBoughtABNB,
    value: String.youHaveSuccessfullyPurchasedABNB,
    isDark: false,
    time: 'Oct 11',
  },
  {
    id: 8,
    image: images.AdaImage,
    title: String.successfullyBoughtADA,
    value: String.youHaveSuccessfullyPurchasedADA,
    isDark: false,
    time: 'Sep 12',
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

export const BuyGoldData = [
  {
    id: 1,
    svgIcon: <USFlagIcon />,
    title: String.usa,
  },
  {
    id: 2,
    svgIcon: <CanadaIcon />,
    title: String.canada,
  },
  {
    id: 3,
    svgIcon: <UKFlagIcon />,
    title: String.uk,
  },
  {
    id: 4,
    svgIcon: <JapanIcon />,
    title: String.japan,
  },
];

export const LatestNewsGoldData = [
  {
    id: 1,
    image: images.GoldNewsImage,
    title: String.goldNewsText,
    time: '2h ago',
    newsType: String.theBlock,
  },
  {
    id: 2,
    image: images.EconomicTrashImage,
    title: String.goldNewsText2,
    time: '3h ago',
    newsType: String.goldNews,
  },
];

export const SampleDataGold = [
  {
    date: 'Oct 10',
    value: '86.00',
    label: '2',
  },
  {
    date: 'Oct 11',
    label: '3',
    value: '85.00',
  },
  {
    date: 'Oct 12',
    label: '2',
    value: '87.00',
  },
  {
    date: 'Oct 13',
    label: '5',
    value: '90.00',
  },
  {
    label: '3',
    date: 'Oct 14',
    value: '88.00',
  },
  {
    date: 'Oct 15',
    label: '7',
    value: '92.00',
  },
  {
    date: 'Oct 16',
    label: '4',
    value: '87.00',
  },
];

export const MoreWithGoldData = [
  {
    id: 1,
    title: String.autoInvest,
    svgIcon: <AutoInvestIcon />,
    route: StackNav.AutoInvestGold,
  },
  {
    id: 2,
    title: String.gifts,
    svgIcon: <GiftIcon />,
  },
  {
    id: 3,
    title: String.loans,
    svgIcon: <LoanIcon />,
    route: StackNav.GoldLoan,
  },
  {
    id: 4,
    title: String.redeem,
    svgIcon: <RedeemIcon />,
    route: StackNav.RedeemGold,
  },
];

export const marketOverViewGoldData = [
  {
    id: 1,
    title: String.close,
    value: '87.65',
  },
  {
    id: 2,
    title: String.high,
    value: '88.00',
  },
  {
    id: 3,
    title: String.low,
    value: '87.00',
  },
  {
    id: 4,
    title: String.wRange,
    value: '86.00 - 87.00',
  },
];

export const InstallmentTenureGoldData = [
  {
    id: 1,
    value: '3 months',
  },
  {
    id: 2,
    value: '6 months',
  },
  {
    id: 3,
    value: '12 months',
  },
  {
    id: 4,
    value: '18 months',
  },
  {
    id: 5,
    value: '24 months',
  },
];

export const LoanSimulationGoldData = [
  {
    id: 1,
    title: String.totalLoanValue,
    value: '$25,987.00',
    description: String.buyPrice,
  },
  {
    id: 2,
    title: String.monthlyInstallment,
    value: '$1,454.00',
    description: String.forNextMonth,
  },
  {
    id: 3,
    title: String.firstPayment,
    value: '$5,678.98',
    description: String.dueNow,
  },
];

export const GoldGramData = [
  {
    id: 1,
    value: '0,10 g',
  },
  {
    id: 2,
    value: '0,50 g',
  },
  {
    id: 3,
    value: '5,00 g',
  },
  {
    id: 4,
    value: '10,00 g',
  },
];

export const GoldTimeDetails = [
  {
    id: 1,
    time: '24H',
  },
  {
    id: 2,
    time: '1W',
  },
  {
    id: 3,
    time: '1M',
  },
  {
    id: 4,
    time: '1Y',
  },
  {
    id: 5,
    time: String.all,
  },
];

export const GoldHistoryData = [
  {
    title: '20 October 2022',
    data: [
      {
        id: 1,
        image: images.GoldImage,
        title: String.buyGold,
        time: '04:00 PM',
        profit: ' + 1,0g',
        profitValue: '$87.65',
      },
      {
        id: 2,
        image: images.GoldImage,
        title: String.sellGold,
        time: '10:15 PM',
        loss: '- 5,0g',
        lossValue: '$549.00',
      },
      {
        id: 3,
        image: images.DollarImage,
        title: String.deposit,
        time: '07:00 AM',
        amount: '+ $234.00',
      },
    ],
  },
  {
    title: '10 October 2022',
    data: [
      {
        id: 4,
        image: images.DollarImage,
        title: String.deposit,
        time: '07:00 PM',
        amount: '+ $560.00',
      },
      {
        id: 5,
        image: images.GoldImage,
        title: String.buyGold,
        time: '04:00 PM',
        profit: ' + 1,0g',
        profitValue: '$87.65',
      },
      {
        id: 6,
        image: images.GoldImage,
        title: String.sellGold,
        time: '10:15 PM',
        loss: '- 5,0g',
        lossValue: '$549.00',
      },
    ],
  },
];

export const MyWalletCategoryData = [
  {
    id: 1,
    svgIcon: <DepositIcon />,
    title: String.deposit,
    route: StackNav.MyWalletDeposit,
  },
  {
    id: 2,
    svgIcon: <WithdrawIcon />,
    title: String.withdraw,
    route: StackNav.MyWalletWithdraw,
  },
  {
    id: 3,
    svgIcon: <SendIcon />,
    title: String.send,
    route: StackNav.SendWallet,
  },
  {
    id: 4,
    svgIcon: <Dollar_White />,
    title: String.receive,
  },
];

export const MyWalletData = [
  {
    title: '20 October 2022',
    data: [
      {
        id: 1,
        image: images.SendImage,
        title: String.sendAmzn,
        time: '07:00 PM',
        profit: ' -2.00',
        profitValue: '$224.90',
      },
    ],
  },
  {
    title: '15 October 2022',
    data: [
      {
        id: 2,
        image: images.AppleImage,
        title: String.buyAppl,
        time: '04:00 PM',
        profit: ' +47.00',
        profitValue: '$1,016.33',
      },
      {
        id: 3,
        image: images.AdaImage,
        title: String.sellAda,
        time: '03:00 PM',
        loss: ' - 250',
        profitValue: '$87.69',
      },
    ],
  },
  {
    title: '30 September 2022',
    data: [
      {
        id: 4,
        image: images.AmdImage,
        title: String.buyAmd,
        time: '08: 15 PM',
        profit: ' +3.00',
        profitValue: '$172.38',
      },
      {
        id: 5,
        image: images.GoldImage,
        title: String.sellGold,
        time: '10:15 AM',
        loss: ' - 5,0g',
        profitValue: '$549.00',
      },
      {
        id: 6,
        image: images.BitcoinImage,
        title: String.btcAndUsd,
        time: '10:12 AM',
        profit: ' 0.500',
        profitValue: '9.594',
      },
    ],
  },
];

export const WalletDepositMethodData = [
  {
    title: String.bankTransfer,
    data: [
      {
        id: 1,
        svgIcon: <BankAmericaIcon />,
        title: String.bankOfAmerica,
        value: String.checkedAutomatically,
      },
      {
        id: 2,
        svgIcon: <BraclaysIcon />,
        title: String.barclays,
        value: String.checkedAutomatically,
      },
      {
        id: 3,
        svgIcon: <WellsFargo />,
        title: String.wellsFargo,
        value: String.checkedAutomatically,
      },
    ],
  },
  {
    title: String.creditAndDebitCard,
    data: [
      {
        id: 4,
        svgIcon: <VisaIcon />,
        title: String.visa,
        value: '**** **** **** 4567',
      },
      {
        id: 5,
        svgIcon: <MasterCardIcon />,
        title: String.mastercard,
        value: '**** **** **** 3456',
      },
    ],
  },
  {
    title: String.eWallet,
    data: [
      {
        id: 6,
        svgIcon: <PayPalIcon />,
        title: String.paypal,
        value: String.checkedAutomatically,
      },
    ],
  },
];

export const DepositPreviewData = [
  {
    id: 1,
    title: String.depositID,
    value: '123Tyu890XBNu',
  },
  {
    id: 2,
    title: String.depositAmount,
    value: '$280.00',
  },
  {
    id: 3,
    title: String.depositFee,
    value: '$2.00',
  },

  {
    id: 4,
    title: String.payment,
    value: String.bankOfAmerica,
  },
  {
    id: 5,
    title: String.time,
    value: '31 Oct 2022, 02:00 PM',
  },
  {
    id: 6,
    title: String.totalAmount,
    value: '$282.00',
  },
];

export const WalletWithdrawMethodData = [
  {
    title: String.bankTransfer,
    data: [
      {
        id: 1,
        svgIcon: <BankAmericaIcon />,
        title: String.bankOfAmerica,
        value: String.checkedAutomatically,
      },
      {
        id: 2,
        svgIcon: <BraclaysIcon />,
        title: String.barclays,
        value: String.checkedAutomatically,
      },
    ],
  },
  {
    title: String.creditAndDebitCard,
    data: [
      {
        id: 4,
        svgIcon: <VisaIcon />,
        title: String.visa,
        value: '**** **** **** 4567',
      },
      {
        id: 5,
        svgIcon: <MasterCardIcon />,
        title: String.mastercard,
        value: '**** **** **** 3456',
      },
    ],
  },
];

export const TransferContactList = [
  {
    title: String.favorites,
    data: [
      {
        id: 1,
        image: images.UserImage1,
        userName: String.aileenFullbright,
        value: '+1 7896 8797 908',
      },
      {
        id: 2,
        image: images.UserImage2,
        userName: String.leifFloyd,
        value: '+7 445 553 3864',
      },
    ],
  },
  {
    title: String.allContacts,
    data: [
      {
        id: 3,
        image: images.UserImage3,
        userName: String.tyraDhillon,
        value: '+995 940 555 766',
      },
      {
        id: 4,
        image: images.UserImage4,
        userName: String.marielleWigington,
        value: '+56 955 588 939',
      },
      {
        id: 5,
        image: images.UserImage5,
        userName: String.freidaVarnes,
        value: '+226 755 558 14',
      },
      {
        id: 6,
        image: images.UserImage6,
        userName: String.thadEddings,
        value: '+7 445 556 8337',
      },
    ],
  },
];

export const TransferPreviewData = [
  {
    id: 1,
    title: String.transferID,
    value: '123Tyu890XBNu',
  },
  {
    id: 2,
    title: String.recipient,
    value: String.aileenFullbright,
  },
  {
    id: 3,
    title: String.transferAmount,
    value: '$567.00',
  },
  {
    id: 4,
    title: String.transferFee,
    value: '$2.00',
  },
  {
    id: 5,
    title: String.payment,
    value: String.bankOfAmerica,
  },
  {
    id: 6,
    title: String.time,
    value: '31 Oct 2022, 02:00 PM',
  },
  {
    id: 7,
    title: String.totalAmount,
    value: '$282.00',
  },
];

export const OverViewPortfolio = [
  {
    id: 1,
    svgIcon: <Crypto_Dark />,
    title: String.crypto,
    value: '10 ' + String.assets,
    profitValue: '$20,321.00',
    profit: '0.24%',
    profits: String.profits,
    profitsInDollar: '$16,988.00',
  },
  {
    id: 2,
    svgIcon: <Stock_Dark />,
    title: String.stocks,
    value: '5 ' + String.assets,
    profitValue: '$5,687.99',
    loss: '1.35%',
    profits: String.profits,
    profitsInDollar: '$2,567.00',
  },
];

export const PortfolioHistoryData = [
  {
    title: '20 October 2022',
    data: [
      {
        id: 1,
        image: images.SendImage,
        label: String.sendAmzn,
        time: '07:00 PM',
        profit: '-2.00',
        value: '$224.90',
        item: String.amzn,
      },
    ],
  },
  {
    title: '15 October 2022',
    data: [
      {
        id: 2,
        image: images.AppleImage,
        label: String.buyAppl,
        time: '04:00 PM',
        profit: '+7.00',
        value: '$1,016.33',
        item: String.apple,
      },
      {
        id: 3,
        image: images.AdaImage,
        label: String.sellAda,
        time: '03:00 PM',
        loss: '-2.00',
        value: '$87.69',
        item: String.ada,
      },
    ],
  },
  {
    title: '30 September 2022',
    data: [
      {
        id: 4,
        image: images.AmdImage,
        label: String.buyAmd,
        time: '08:15 PM',
        profit: '+3.00',
        value: '$172.38',
        item: String.amd,
      },
      {
        id: 5,
        image: images.GoldImage,
        label: String.sellGold,
        time: '10:15 PM',
        loss: '-5,0g',
        value: '$549.00',
        item: String.gold,
      },
      {
        id: 6,
        image: images.BitcoinImage,
        label: String.btcAndUsd,
        time: '10:12 PM',
        profit: '0.500',
        value: '9.594',
        item: String.bitcoin,
      },
    ],
  },
];

export const PortfolioChartData = [
  {
    id: 1,
    title: 'Sun',
    value: '3',
  },
  {
    id: 2,
    title: 'Mon',
    value: '1',
  },
  {
    id: 3,
    title: 'Wed',
    value: '6',
  },
  {
    id: 4,
    title: 'Thu',
    value: '2',
  },
  {
    id: 5,
    title: 'Fri',
    value: '5',
  },
  {
    id: 6,
    title: 'Sat',
    value: '1',
  },
];

export const PieChartPortfolioData = [
  {
    x: String.buy,
    y: '60%',
    z: 5,
    dotColor: colors.primary,
  },
  {
    x: String.send,
    y: '10%',
    z: 5,
    dotColor: colors.blue,
  },
  {
    x: String.receive,
    y: '30%',
    z: 5,
    dotColor: colors.green,
  },
];

export const PortTransactionHistory = [
  {
    id: 1,
    date: '23 Sep at',
  },
  {
    id: 2,
    label: String.purchaseAda,
    time: '10 Sep at 02:00 PM',
    profit: '+1,250',
    value: '$105.00',
  },
  {
    id: 3,
    image: images.SendImage,
    label: String.sendAda,
    time: '22 Aug at 10:00 AM',
    profit: '-2.00',
    value: '$5.90',
  },
];

export const LineChartData1 = [
  {
    id: 1,
    x: '1',
    y: '3',
  },
  {
    id: 2,
    x: '2',
    y: '2',
  },
  {
    id: 3,
    x: '3',
    y: '1',
  },
];
export const LineChartData2 = [
  {
    id: 1,
    x: '1',
    y: '5',
  },
  {
    id: 2,
    x: '2',
    y: '2',
  },
  {
    id: 3,
    x: '3',
    y: '7',
  },
];

export const LineChartData3 = [
  {
    id: 1,
    x: '1',
    y: '3',
  },
  {
    id: 2,
    x: '2',
    y: '4',
  },
  {
    id: 3,
    x: '3',
    y: '9',
  },
];

export const PurchaseSendReceive = [
  {
    id: 1,
    x: String.purchase,
  },
  {
    id: 2,
    x: String.send,
  },
  {
    id: 3,
    x: String.receive,
  },
];

export const PortfolioHistoryReport = [
  {
    id: 1,
    title: String.referenceCode,
    value: 'AqUXby',
  },
  {
    id: 2,
    title: String.pricePercoin,
    value: '$0.3913',
  },
  {
    id: 3,
    title: String.networkFee,
    value: '$0.00',
  },

  {
    id: 4,
    title: String.payment,
    value: String.bankOfAmerica,
  },
  {
    id: 5,
    title: String.time,
    value: '10 Sep 2022, 02:00 PM',
  },
  {
    id: 6,
    title: String.status,
    value: String.successful,
  },
  {
    id: 7,
    title: String.totalAmount,
    value: '$282.00',
  },
];

export const CryptoChartData = [
  {
    date: 'Oct 10',
    value: '86.00',
    label: '2',
  },
  {
    date: 'Oct 11',
    label: '3',
    value: '85.00',
  },
  {
    date: 'Oct 12',
    label: '2',
    value: '87.00',
  },
  {
    date: 'Oct 13',
    label: '5',
    value: '90.00',
  },
  {
    label: '3',
    date: 'Oct 14',
    value: '88.00',
  },
  {
    date: 'Oct 15',
    label: '7',
    value: '92.00',
  },
  {
    date: 'Oct 16',
    label: '4',
    value: '77.00',
  },
  {
    date: 'Oct 17',
    label: '2',
    value: '20.00',
  },
  {
    date: 'Oct 18',
    label: '1',
    value: '35.00',
  },
  {
    date: 'Oct 19',
    label: '6',
    value: '81.00',
  },
  {
    date: 'Oct 20',
    label: '2',
    value: '81.00',
  },
  {
    date: 'Oct 21',
    label: '8',
    value: '81.00',
  },
  {
    date: 'Oct 22',
    label: '3',
    value: '81.00',
  },
  {
    date: 'Oct 23',
    label: '7',
    value: '81.00',
  },
];

export const CandleChartDetails = [
  {
    id: 1,
    x: 'oct 10',
    open: 5,
    close: 10,
    high: 15,
    low: 0,
  },
  {
    id: 2,
    x: 'oct 11',
    open: 10,
    close: 15,
    high: 20,
    low: 5,
  },
  {
    id: 3,
    x: 'oct 12',
    open: 15,
    close: 20,
    high: 22,
    low: 10,
  },
  {
    id: 4,
    x: 'oct 13',
    open: 20,
    close: 10,
    high: 25,
    low: 7,
  },
  {
    id: 5,
    x: 'oct 14',
    open: 10,
    close: 15,
    high: 20,
    low: 5,
  },
  {
    id: 6,
    x: 'oct 14',
    open: 10,
    close: 8,
    high: 15,
    low: 5,
  },
  {
    id: 7,
    x: 'oct 14',
    open: 5,
    close: 10,
    high: 15,
    low: 0,
  },
  {
    id: 8,
    x: 'oct 12',
    open: 15,
    close: 20,
    high: 22,
    low: 10,
  },
  {
    id: 9,
    x: 'oct 14',
    open: 15,
    close: 20,
    high: 20,
    low: 0,
  },
  {
    id: 10,
    x: 'oct 14',
    open: 10,
    close: 20,
    high: 5,
    low: 0,
  },
];

export const BarChartData = [
  {
    id: 1,
    title: 'Sun',
    value: '3',
  },
  {
    id: 2,
    title: 'Mon',
    value: '1',
  },
  {
    id: 3,
    title: 'Wed',
    value: '6',
  },
  {
    id: 4,
    title: 'Thu',
    value: '2',
  },
  {
    id: 5,
    title: 'Fri',
    value: '5',
  },
  {
    id: 6,
    title: 'Sat',
    value: '1',
  },
  {
    id: 7,
    title: 'Sat',
    value: '4',
  },
  {
    id: 8,
    title: 'Sat',
    value: '9',
  },
  {
    id: 9,
    title: 'Sat',
    value: '3',
  },
  {
    id: 6,
    title: 'Sat',
    value: '8',
  },
  {
    id: 10,
    title: 'Sat',
    value: '1',
  },
];

export const TopGrainersDetails = [
  {
    id: 1,
    image: images.PolygonImage,
    title: String.polygon,
    name: String.matic,
    amount: '$0.8016',
    profit: '5.87%',
  },
  {
    id: 2,
    image: images.BnbImage,
    title: String.bnb,
    name: String.bnbs,
    amount: '$271.01',
    profit: '0.90%',
  },
  {
    id: 3,
    image: images.SolanaImage,
    title: String.solana,
    name: String.sol,
    amount: '$31.02',
    profit: '4.80%',
  },
  {
    id: 4,
    image: images.AmdImage,
    title: String.amd,
    name: String.advanceMicroDevices,
    amount: '$57,46',
    profit: '0.90%',
  },
  {
    id: 5,
    image: images.BitcoinImage,
    title: String.bitcoin,
    name: String.btc,
    amount: '$57,46',
    profit: '4.80%',
  },
  {
    id: 6,
    image: images.AirbnbImage,
    title: String.abnb,
    name: String.airbnbInc,
    amount: '$57,46',
    profit: '0.90%',
  },
  {
    id: 7,
    image: images.AdaImage,
    title: String.ada,
    name: String.bnbs,
    amount: '$271.01',
    profit: '0.90%',
  },
  {
    id: 8,
    image: images.SolanaImage,
    title: String.solana,
    name: String.sol,
    amount: '$31.02',
    profit: '4.80%',
  },
];

export const userCoinsAvailable = [
  {
    title: 'BTC',
    iconUrl: 'https://assets.coingecko.com/coins/images/1/standard/bitcoin.png',
    iconSize: moderateScale(25),
  },
  {
    title: 'ETH',
    iconUrl:
      'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    iconSize: moderateScale(25),
  },
  {
    title: 'USDT',
    iconUrl:
      'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
    iconSize: moderateScale(25),
  },
  {
    title: 'BNB',
    iconUrl:
      'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    iconSize: moderateScale(25),
  },
];
