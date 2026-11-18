import {
  ActivityIndicator,
  AppState,
  Image,
  StyleSheet,
  View,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";

// custom import
import CSafeAreaViewAuth from "../../components/common/CSafeAreaViewAuth";
import { getHeight, moderateScale } from "../../common/constants";
import CText from "../../components/common/CText";
import { styles } from "../../themes";
import { useDispatch, useSelector } from "react-redux";
import images from "../../assets/images";
import { AuthNav } from "../../navigation/NavigationKey";
import StepIndicator from "../../components/authComponents/StepIndicator";
import { getSecondaryTextColor } from "../../utils/ThemeUtils";
import String from "../../i18n/String";
import InfoModal from "../../components/modal/InfoModal";

import { saveDraft, clearDraft, getDraft, updateDraft } from "../../utils/RegisterDraft";
import { setAddresses } from "../../redux/slices/addressSlice";
import { normalizeOcrForUI } from "../../utils/issuerClient";
import {
  IdentityApiUnreachableError,
  IdentityCredentialError,
  RegistryRegistrationError,
  VaultError,
} from "@privado-id/expo-sdk";
import { getPrivadoSession } from "@/src/services/privado/privadoSession";
import { withVaultPin } from "@/src/services/privado/vaultUnlock";

import { captureError } from "../../config/sentry";
import { claimRegisterRewardIfAvailable } from "@/src/utils/account";

/**
 * Qué hacer al cerrar el modal de error:
 * - `retry`: volver a ejecutar el registro (los pasos ya hechos se saltan).
 * - `pin`: volver a elegir el PIN.
 * - `verify`: repetir la verificación del carnet (token de identidad vencido o usado).
 */
const describeRegisterError = (err) => {
  const code = err?.code;
  if (err instanceof IdentityApiUnreachableError) {
    return { message: String.networkError, next: "retry", expected: true };
  }
  if (err instanceof VaultError) {
    if (code === "BIOMETRICS_CANCELLED") {
      return { message: String.biometricRejected, next: "retry", expected: true };
    }
    if (code === "BIOMETRICS_UNAVAILABLE") {
      return { message: String.biometryNotAvailable, next: "retry", expected: true };
    }
    if (code === "INVALID_PIN" || code === "PIN_TOO_SHORT") {
      return {
        message: "El PIN no coincide con el que elegiste al iniciar el registro. Vuelve a ingresarlo.",
        next: "pin",
        expected: true,
      };
    }
  }
  if (
    (err instanceof IdentityCredentialError || err instanceof RegistryRegistrationError) &&
    (code === "identity-invalid" || code === "identity-required")
  ) {
    return {
      message: "La verificación de tu carnet expiró. Vuelve a verificar tu identidad para continuar.",
      next: "verify",
      expected: true,
    };
  }
  if (err instanceof RegistryRegistrationError && code === "identity-conflict") {
    return {
      message: "Este carnet ya está registrado con otra cuenta.",
      next: "verify",
      expected: false,
    };
  }
  return {
    message: err?.message || "Ocurrió un error al registrar tu cuenta.",
    next: "retry",
    expected: false,
  };
};

export default function RegisterUser10({ navigation, route }) {
  const {
    ocrData,
    dni,
    originalPin: pin,
    useBiometry,
    identityData,
    identityToken,
    identityTokenExpiresAt,
  } = route.params;

  const colors = useSelector((state) => state.theme.theme);
  const [loading, setLoading] = useState(true);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorNext, setErrorNext] = useState("retry");
  const [stage, setStage] = useState("init");
  const watchdogRef = useRef(null);
  const dispatch = useDispatch();

  const startedRef = useRef(false);
  const stageRef = useRef(stage);
  const wentToBackgroundRef = useRef(false);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const restartRegister = async () => {
    const draft = await getDraft();

    if (draft) {
      navigation.replace(AuthNav.RegisterUser10, {
        ...draft,
        ocrData: draft.ocrData ?? route.params?.ocrData ?? null,
        fromDraft: true,
      });
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        wentToBackgroundRef.current = true;
      } else if (nextState === "active") {
        if (wentToBackgroundRef.current) {
          restartRegister();
        }
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    clearTimeout(watchdogRef.current);
    if (stage === "done") return;
    watchdogRef.current = setTimeout(() => {
      setStage((s) => (s !== "done" ? "stillWorking" : s));
    }, 30000);
    return () => clearTimeout(watchdogRef.current);
  }, [stage]);

  useEffect(() => {
    (async () => {
      if (route.params?.fromDraft) {
        initRegister(route.params.progress);
        return;
      }

      // Llegada con datos nuevos (p. ej. tras repetir la verificación): se usan
      // estos y solo se conserva el progreso del borrador del mismo DNI.
      const draft = await getDraft();
      initRegister(draft && draft.dni === dni ? draft.progress : undefined);
    })();
  }, []);

  const initRegister = useCallback((previousProgress) => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      await new Promise((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => requestAnimationFrame(() => r()));
      try {
        const yieldUI = () => new Promise((r) => setTimeout(r, 50));
        setStage("issueVC");
        await yieldUI();

        // Pasos ya hechos en un intento anterior: se saltan al reintentar.
        const progress = { ...(previousProgress ?? {}) };
        await saveDraft({
          step: "issueVC",
          dni,
          useBiometry,
          originalPin: pin,
          ocrData: normalizeOcrForUI(ocrData),
          identityData,
          identityToken,
          identityTokenExpiresAt,
          progress: { ...progress },
        });
        const markDone = async (step) => {
          progress[step] = true;
          await updateDraft({ progress: { ...progress } });
        };

        const { client, vault } = await getPrivadoSession();

        // El PIN elegido en RegisterUser8/9 crea el vault (claves privadas y
        // clave de las credenciales) o lo abre si ya existe de un intento anterior.
        const account = await withVaultPin(pin, async () => {
          const holder = await client.createOrLoadHolderDid({ smartWallet: true });
          const accountAddress = holder.wallet.address;
          dispatch(setAddresses({ account: accountAddress }));

          if (!progress.credentialClaimed) {
            // /credentials/identity verifica el token sin consumirlo.
            const issued = await client.requestIdentityCredential({
              data: identityData,
              identityToken,
            });
            const claim = await client.claimCredentialFromIssuer({ offer: issued.deepLink });
            if (!claim.stored) {
              throw new Error("No se pudo guardar tu credencial de identidad.");
            }
            await markDone("credentialClaimed");
          }

          setStage("save");
          await yieldUI();

          if (useBiometry && !(await vault.isBiometricsEnabled())) {
            await vault.enableBiometrics();
          }

          if (!progress.registered) {
            // El respaldo cifrado con el PIN es el que devuelve la recuperación
            // con carnet. /registry/register consume el token: no se repite.
            const backup = await client.createBackup(pin);
            await client.registerAccount({ identityToken, backup });
            await markDone("registered");
          }

          if (!progress.rewardClaimed) {
            await claimRegisterRewardIfAvailable(accountAddress);
            await markDone("rewardClaimed");
          }

          return accountAddress;
        });

        await clearDraft();
        setStage("done");
        setLoading(false);
        navigation.replace(AuthNav.RegisterUser11, { account });
      } catch (err) {
        if (wentToBackgroundRef.current) {
          return;
        }

        const { message, next, expected } = describeRegisterError(err);
        if (!expected) {
          captureError(err, {
            flow: "registration",
            step: stageRef.current,
            critical: true,
            code: err?.code,
          });
        }

        setLoading(false);
        setErrorMessage(message);
        setErrorNext(next);
        setErrorModalVisible(true);
      }
    })();
    return () => {};
  }, [pin, dni, useBiometry, navigation, identityData, identityToken]);

  const onCloseError = () => {
    setErrorModalVisible(false);
    if (errorNext === "pin") {
      navigation.replace(AuthNav.RegisterUser8, {
        ocrData,
        useBiometry,
        dni,
        identityData,
        identityToken,
        identityTokenExpiresAt,
      });
    } else if (errorNext === "verify") {
      navigation.reset({
        index: 0,
        routes: [{ name: AuthNav.RegisterUser2 }],
      });
    } else {
      navigation.replace(AuthNav.RegisterUser10, {
        ocrData,
        dni,
        originalPin: pin,
        useBiometry,
        identityData,
        identityToken,
        identityTokenExpiresAt,
      });
    }
  };

  const stageMessage = {
    issueVC: String.issuingVC,
    save: String.saveData,
    done: String.doneRegister,
    stillWorking: "Aún trabajando… Esto puede tardar en tu dispositivo.",
  }[stage];

  return (
    <CSafeAreaViewAuth style={localStyle.root}>
      <StepIndicator step={10} />
      <View style={localStyle.center}>
        <View style={localStyle.mainContainer}>
          <Image
            source={
              colors.dark
                ? images.IdentityCardImage
                : images.IdentityCard_lightImage
            }
            style={localStyle.imageContainer}
          />
          <CText type={"B20"} style={styles.boldText} align={"center"}>
            {stageMessage}
          </CText>
          <CText
            type={"B16"}
            color={getSecondaryTextColor(colors)}
            align={"center"}
          >
            {String.verifyingIdentityMessage}
          </CText>
          {loading && (
            <ActivityIndicator
              size={60}
              color={colors.grayScale500}
              style={localStyle.marginTop}
            />
          )}
        </View>
      </View>
      <InfoModal
        visible={errorModalVisible}
        title="Registro fallido"
        message={errorMessage}
        buttonText="Reintentar"
        onClose={onCloseError}
      />
    </CSafeAreaViewAuth>
  );
}

const localStyle = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer: {
    ...styles.ph20,
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },
  btnStyle: {
    ...styles.selfCenter,
  },
  divider: {
    ...styles.rowCenter,
    ...styles.mt20,
  },
  orContainer: {
    height: getHeight(1),
    width: "20%",
  },
  socialBtn: {
    ...styles.center,
    height: getHeight(45),
    width: "46%",
    borderRadius: moderateScale(16),
    borderWidth: moderateScale(1),
    ...styles.mh10,
    ...styles.mt20,
  },
  socialBtnContainer: {
    ...styles.flexRow,
  },
  bottomTextContainer: {
    ...styles.ph20,
    gap: 5,
  },
  marginTop: {
    marginTop: moderateScale(20),
  },
  rowWithGap: {
    flexDirection: "row",
    columnGap: 10,
  },
  item: {
    width: "95%",
  },
  imageContainer: {
    ...styles.selfCenter,
    height: moderateScale(180),
    width: moderateScale(180),
  },
  margin: {
    marginBottom: "20px",
  },
});
