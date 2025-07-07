import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {StackNav} from '../NavigationKey';
import {StackRoute} from '../NavigationRoute';
import CameraScreen from '../../container/Voto/SubirActa/CameraScreen';

const Stack = createStackNavigator();

export default function StackNavigation() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={StackNav.Splash}>
      <Stack.Screen name={StackNav.Splash} component={StackRoute.Splash} />
      {/* <Stack.Screen
        name={StackNav.OnBoarding}
        component={StackRoute.OnBoarding}
      /> */}
      <Stack.Screen
        name={StackNav.AuthNavigation}
        component={StackRoute.AuthNavigation}
      />
      <Stack.Screen
        name={StackNav.TabNavigation}
        component={StackRoute.TabNavigation}
      />

      {/* Pantallas de Voto */}
      {/* <Stack.Screen
        name={StackNav.SubirActa}
        component={StackRoute.SubirActa}
      /> */}
      <Stack.Screen
        name={StackNav.BuscarMesa}
        component={StackRoute.BuscarMesa}
      />
      <Stack.Screen
        name={StackNav.DetalleMesa}
        component={StackRoute.DetalleMesa}
      />
      <Stack.Screen
        name={StackNav.AtestiguarActa}
        component={StackRoute.AtestiguarActa}
      />
      <Stack.Screen
        name={StackNav.AnunciarConteo}
        component={StackRoute.AnunciarConteo}
      />
      <Stack.Screen
        name={StackNav.BuscarMesaConteo}
        component={StackRoute.BuscarMesaConteo}
      />
      <Stack.Screen
        name={StackNav.DetalleMesaConteo}
        component={StackRoute.DetalleMesaConteo}
      />
      <Stack.Screen
        name={StackNav.MisAtestiguamientos}
        component={StackRoute.MisAtestiguamientos}
      />

      <Stack.Screen
        name={StackNav.CryptoScreen}
        component={StackRoute.CryptoScreen}
      />
      <Stack.Screen
        name={StackNav.NFTsScreen}
        component={StackRoute.NFTsScreen}
      />
      <Stack.Screen
        name={StackNav.GoldScreen}
        component={StackRoute.GoldScreen}
      />
      <Stack.Screen
        name={StackNav.StocksScreen}
        component={StackRoute.StocksScreen}
      />
      <Stack.Screen
        name={StackNav.SearchCryptoSort}
        component={StackRoute.SearchCryptoSort}
      />
      <Stack.Screen
        name={StackNav.CryptoDetails}
        component={StackRoute.CryptoDetails}
      />
      <Stack.Screen
        name={StackNav.PortfolioOfCrypto}
        component={StackRoute.PortfolioOfCrypto}
      />
      <Stack.Screen
        name={StackNav.BuyCrypto}
        component={StackRoute.BuyCrypto}
      />
      <Stack.Screen
        name={StackNav.ExchangeCrypto}
        component={StackRoute.ExchangeCrypto}
      />
      <Stack.Screen
        name={StackNav.CryptoHistory}
        component={StackRoute.CryptoHistory}
      />
      <Stack.Screen
        name={StackNav.MarketSectors}
        component={StackRoute.MarketSectors}
      />
      <Stack.Screen
        name={StackNav.SearchStocks}
        component={StackRoute.SearchStocks}
      />
      <Stack.Screen
        name={StackNav.DetailsStock}
        component={StackRoute.DetailsStock}
      />
      <Stack.Screen
        name={StackNav.StockPortfolio}
        component={StackRoute.StockPortfolio}
      />
      <Stack.Screen name={StackNav.BuyStock} component={StackRoute.BuyStock} />
      <Stack.Screen
        name={StackNav.ExchangeStock}
        component={StackRoute.ExchangeStock}
      />
      <Stack.Screen
        name={StackNav.StockHistory}
        component={StackRoute.StockHistory}
      />
      <Stack.Screen name={StackNav.PlaceBid} component={StackRoute.PlaceBid} />
      <Stack.Screen
        name={StackNav.CollectionItem}
        component={StackRoute.CollectionItem}
      />
      <Stack.Screen
        name={StackNav.ActivityNFts}
        component={StackRoute.ActivityNFts}
      />
      <Stack.Screen
        name={StackNav.CollectionItemDetails}
        component={StackRoute.CollectionItemDetails}
      />
      <Stack.Screen
        name={StackNav.CreatedByCollection}
        component={StackRoute.CreatedByCollection}
      />
      <Stack.Screen
        name={StackNav.PersonalDetails}
        component={StackRoute.PersonalDetails}
      />
      <Stack.Screen
        name={StackNav.RecuperationQR}
        component={StackRoute.RecuperationQR}
      />
      <Stack.Screen name={StackNav.Reward} component={StackRoute.Reward} />
      <Stack.Screen
        name={StackNav.RewardHistory}
        component={StackRoute.RewardHistory}
      />
      <Stack.Screen
        name={StackNav.RewardCode}
        component={StackRoute.RewardCode}
      />
      <Stack.Screen
        name={StackNav.Guardians}
        component={StackRoute.Guardians}
      />
      <Stack.Screen
        name={StackNav.GuardiansAdmin}
        component={StackRoute.GuardiansAdmin}
      />
      <Stack.Screen
        name={StackNav.AddGuardians}
        component={StackRoute.AddGuardians}
      />
      <Stack.Screen
        name={StackNav.TransactionHistory}
        component={StackRoute.TransactionHistory}
      />
      <Stack.Screen
        name={StackNav.TransactionItem}
        component={StackRoute.TransactionItem}
      />

      <Stack.Screen
        name={StackNav.BankAccount}
        component={StackRoute.BankAccount}
      />
      <Stack.Screen
        name={StackNav.BankAccountDetails}
        component={StackRoute.BankAccountDetails}
      />
      <Stack.Screen
        name={StackNav.AddBankAccount}
        component={StackRoute.AddBankAccount}
      />
      <Stack.Screen
        name={StackNav.SelectLanguage}
        component={StackRoute.SelectLanguage}
      />
      <Stack.Screen
        name={StackNav.PushNotification}
        component={StackRoute.PushNotification}
      />
      <Stack.Screen
        name={StackNav.HelpCenter}
        component={StackRoute.HelpCenter}
      />

      <Stack.Screen name={StackNav.Security} component={StackRoute.Security} />

      <Stack.Screen name={StackNav.Limit} component={StackRoute.Limit} />

      <Stack.Screen name={StackNav.Suport} component={StackRoute.Suport} />

      {/* <Stack.Screen
        name={StackNav.Condition}
        component={StackRoute.Condition}
      /> */}

      {/* <Stack.Screen name={StackNav.Policy} component={StackRoute.Policy} /> */}

      <Stack.Screen
        name={StackNav.FAQScreen}
        component={StackRoute.FAQScreen}
      />
      <Stack.Screen
        name={StackNav.PrivacyPolicies}
        component={StackRoute.PrivacyPolicies}
      />
      <Stack.Screen
        name={StackNav.ChangePinVerify}
        component={StackRoute.ChangePinVerify}
      />
      <Stack.Screen
        name={StackNav.ChangePinNew}
        component={StackRoute.ChangePinNew}
      />
      <Stack.Screen
        name={StackNav.ChangePinNewConfirm}
        component={StackRoute.ChangePinNewConfirm}
      />
      <Stack.Screen
        name={StackNav.TermsAndCondition}
        component={StackRoute.TermsAndCondition}
      />
      <Stack.Screen
        name={StackNav.ReferralCode}
        component={StackRoute.ReferralCode}
      />
      <Stack.Screen
        name={StackNav.Notification}
        component={StackRoute.Notification}
      />
      <Stack.Screen
        name={StackNav.NotificationDetails}
        component={StackRoute.NotificationDetails}
      />
      <Stack.Screen
        name={StackNav.GoldDetails}
        component={StackRoute.GoldDetails}
      />
      <Stack.Screen
        name={StackNav.AutoInvestGold}
        component={StackRoute.AutoInvestGold}
      />
      <Stack.Screen name={StackNav.GoldLoan} component={StackRoute.GoldLoan} />
      <Stack.Screen
        name={StackNav.RedeemGold}
        component={StackRoute.RedeemGold}
      />
      <Stack.Screen name={StackNav.BuyGold} component={StackRoute.BuyGold} />
      <Stack.Screen
        name={StackNav.GoldHistory}
        component={StackRoute.GoldHistory}
      />
      <Stack.Screen
        name={StackNav.MyWalletDeposit}
        component={StackRoute.MyWalletDeposit}
      />
      <Stack.Screen
        name={StackNav.SelectBankAccountDeposit}
        component={StackRoute.SelectBankAccountDeposit}
      />
      <Stack.Screen
        name={StackNav.DepositPreview}
        component={StackRoute.DepositPreview}
      />
      <Stack.Screen
        name={StackNav.DepositSuccessful}
        component={StackRoute.DepositSuccessful}
      />
      <Stack.Screen
        name={StackNav.MyWalletWithdraw}
        component={StackRoute.MyWalletWithdraw}
      />
      <Stack.Screen
        name={StackNav.SelectBankAccountWithdraw}
        component={StackRoute.SelectBankAccountWithdraw}
      />
      <Stack.Screen
        name={StackNav.WithdrawSuccessful}
        component={StackRoute.WithdrawSuccessful}
      />
      <Stack.Screen
        name={StackNav.SendWallet}
        component={StackRoute.SendWallet}
      />
      <Stack.Screen
        name={StackNav.TransferBalance}
        component={StackRoute.TransferBalance}
      />
      <Stack.Screen
        name={StackNav.TransferPreview}
        component={StackRoute.TransferPreview}
      />
      <Stack.Screen
        name={StackNav.PortfolioHistory}
        component={StackRoute.PortfolioHistory}
      />
      <Stack.Screen name={StackNav.AboutApp} component={StackRoute.AboutApp} />
      <Stack.Screen
        name={StackNav.HistoryTransactionDetails}
        component={StackRoute.HistoryTransactionDetails}
      />
      <Stack.Screen
        name={StackNav.HistoryReport}
        component={StackRoute.HistoryReport}
      />
      <Stack.Screen
        name={StackNav.SellStock}
        component={StackRoute.SellStock}
      />
      <Stack.Screen
        name={StackNav.SellCrypto}
        component={StackRoute.SellCrypto}
      />
      <Stack.Screen
        name={StackNav.WatchListHomeCard}
        component={StackRoute.WatchListHomeCard}
      />
      <Stack.Screen
        name={StackNav.StockFutures}
        component={StackRoute.StockFutures}
      />
      <Stack.Screen
        name={StackNav.TopGrainers}
        component={StackRoute.TopGrainers}
      />
      <Stack.Screen
        name={StackNav.SuccessfulInvest}
        component={StackRoute.SuccessfulInvest}
      />
      <Stack.Screen
        name={StackNav.PurchaseTokens}
        component={StackRoute.PurchaseTokens}
      />
      <Stack.Screen
        name={StackNav.PurchaseDetails}
        component={StackRoute.PurchaseDetails}
      />
      <Stack.Screen
        name={StackNav.ReceiveWithQR}
        component={StackRoute.ReceiveWithQR}
      />
      <Stack.Screen
        name={StackNav.ReceiveDetails}
        component={StackRoute.ReceiveDetails}
      />
      <Stack.Screen
        name={StackNav.SendDetails}
        component={StackRoute.SendDetails}
      />
      <Stack.Screen
        name={StackNav.SendValidation}
        component={StackRoute.SendValidation}
      />
      <Stack.Screen
        name={StackNav.SendSuccess}
        component={StackRoute.SendSuccess}
      />
      <Stack.Screen
        name={StackNav.SendWithQR}
        component={StackRoute.SendWithQR}
      />
      <Stack.Screen
        name={StackNav.SendWithID}
        component={StackRoute.SendWithID}
      />
      <Stack.Screen
        name={StackNav.SendWithWallet}
        component={StackRoute.SendWithWallet}
      />
      <Stack.Screen
        name={StackNav.SendWalletHelp}
        component={StackRoute.SendWalletHelp}
      />
      <Stack.Screen
        name={StackNav.ReceiveTokenDetails}
        component={StackRoute.ReceiveTokenDetails}
      />
      <Stack.Screen
        name="CameraScreen"
        component={CameraScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={StackNav.PhotoReviewScreen}
        component={StackRoute.PhotoReviewScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name={StackNav.PhotoConfirmationScreen}
        component={StackRoute.PhotoConfirmationScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
}
