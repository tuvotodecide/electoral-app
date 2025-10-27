import { formatUnits, fromHex } from "viem";
import { getAccount, getWalletBalances } from "../../api/account";
import { nativeTokens } from "../../api/params";
import images from "../../assets/images";
import { setAccount, setBalance } from "../slices/accountSlice";
import Decimal from "decimal.js";
import { Image } from "react-native";

export const instantiateAccountAddress = (privateKey, salt) => async dispatch => {
	try {
		const account = await getAccount(privateKey, salt, 'opSepolia');
		dispatch(setAccount(account.address));
	} catch (error) {
	}
}

export const setAccountBalance = () => async (dispatch, getState) => {
	const account = getState().wallet.payload;
  if(!account || !account.account) return;
	try {
    const response = await getWalletBalances(account.account);
    const tokens = response.data.tokens;

    let totalBalance = new Decimal(0);
    const tokenBalances = [];
    for(const token of tokens) {
      const tokenData = {
        network: token.network,
        address: token.tokenAddress,
        name: token.tokenMetadata.name ?? nativeTokens[token.network].name,
        decimals: token.tokenMetadata.decimals ?? nativeTokens[token.network].decimals,
        symbol: token.tokenMetadata.symbol ?? nativeTokens[token.network].symbol,
        logo: token.tokenMetadata.logo,
        tokenPrice: token.tokenPrices.find((price) => price.currency === 'usd')?.value ?? '0',
        balance: '0',
        usdBalance: '0',
      };

      if(!tokenData.logo) {
        tokenData.logo = tokenData.address ? Image.resolveAssetSource(images.GenericCrypto).uri 
          : (nativeTokens[token.network]?.logo ?? Image.resolveAssetSource(images.GenericCrypto).uri);
      }

      tokenData.balance = formatUnits(fromHex(token.tokenBalance, 'bigint'), tokenData.decimals);
      tokenData.usdBalance = (new Decimal(tokenData.balance)).times(tokenData.tokenPrice).toFixed(2);
      totalBalance = totalBalance.plus(tokenData.usdBalance);
      
      tokenBalances.push(tokenData);
    }
    dispatch(setBalance({totalBalance: totalBalance.toFixed(2), tokenBalances}));
  } catch (error) {
  }
}