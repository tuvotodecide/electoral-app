import React, {useRef} from 'react';
import {View, StyleSheet, Image, Dimensions} from 'react-native';
import {
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  clamp,
} from 'react-native-reanimated';
import {moderateScale} from '../../common/constants';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const ZoomablePhoto = ({photoUri}) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const lastScale = useSharedValue(1);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);

  const pinchRef = useRef();
  const panRef = useRef();

  const pinchHandler = useAnimatedGestureHandler({
    onStart: event => {
      originX.value = event.focalX;
      originY.value = event.focalY;
      lastScale.value = scale.value;
    },
    onActive: event => {
      const newScale = Math.max(1, Math.min(lastScale.value * event.scale, 4)); // Límite entre 1x y 4x
      scale.value = newScale;

      // Calcular el desplazamiento basado en el punto focal
      const deltaX =
        (originX.value - SCREEN_WIDTH / 2) * (newScale - lastScale.value);
      const deltaY = (originY.value - 100) * (newScale - lastScale.value); // 100 es aprox la altura del contenedor

      translateX.value = lastTranslateX.value - deltaX;
      translateY.value = lastTranslateY.value - deltaY;
    },
    onEnd: () => {
      lastScale.value = scale.value;
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;

      if (scale.value < 1.2) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        lastScale.value = 1;
        lastTranslateX.value = 0;
        lastTranslateY.value = 0;
      } else {
        // Limitar el desplazamiento para que no se salga de los bordes
        const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTranslateY = (moderateScale(200) * (scale.value - 1)) / 2;

        translateX.value = withSpring(
          clamp(translateX.value, -maxTranslateX, maxTranslateX),
        );
        translateY.value = withSpring(
          clamp(translateY.value, -maxTranslateY, maxTranslateY),
        );
        lastTranslateX.value = translateX.value;
        lastTranslateY.value = translateY.value;
      }
    },
  });

  const panHandler = useAnimatedGestureHandler({
    onStart: () => {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    },
    onActive: event => {
      if (scale.value > 1) {
        const maxTranslateX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTranslateY = (moderateScale(200) * (scale.value - 1)) / 2;

        translateX.value = clamp(
          lastTranslateX.value + event.translationX,
          -maxTranslateX,
          maxTranslateX,
        );
        translateY.value = clamp(
          lastTranslateY.value + event.translationY,
          -maxTranslateY,
          maxTranslateY,
        );
      }
    },
    onEnd: () => {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    },
  });

  const doubleTapHandler = useAnimatedGestureHandler({
    onEnd: () => {
      if (scale.value > 1) {
        // Reset zoom
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        lastScale.value = 1;
        lastTranslateX.value = 0;
        lastTranslateY.value = 0;
      } else {
        // Zoom to 2x
        scale.value = withSpring(2);
        lastScale.value = 2;
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
        {scale: scale.value},
      ],
    };
  });

  return (
    <View style={styles.photoContainer}>
      <TapGestureHandler numberOfTaps={2} onGestureEvent={doubleTapHandler}>
        <Animated.View>
          <PanGestureHandler
            ref={panRef}
            onGestureEvent={panHandler}
            simultaneousHandlers={[pinchRef]}
            minPointers={1}
            maxPointers={1}>
            <Animated.View>
              <PinchGestureHandler
                ref={pinchRef}
                onGestureEvent={pinchHandler}
                simultaneousHandlers={[panRef]}>
                <Animated.View style={[styles.photoWrapper, animatedStyle]}>
                  <Image
                    source={{uri: photoUri}}
                    style={styles.photo}
                    resizeMode="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </TapGestureHandler>

      {/* Corner borders */}
      <View style={[styles.cornerBorder, styles.topLeftCorner]} />
      <View style={[styles.cornerBorder, styles.topRightCorner]} />
      <View style={[styles.cornerBorder, styles.bottomLeftCorner]} />
      <View style={[styles.cornerBorder, styles.bottomRightCorner]} />
    </View>
  );
};

const styles = StyleSheet.create({
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(8),
    padding: moderateScale(8),
    marginBottom: moderateScale(16),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden', // Importante para contener el zoom
  },
  photoWrapper: {
    width: '100%',
    height: moderateScale(200),
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(4),
  },
  cornerBorder: {
    position: 'absolute',
    width: moderateScale(20),
    height: moderateScale(20),
    borderColor: '#2F2F2F',
    borderWidth: 2,
    zIndex: 1, // Para que estén por encima de la imagen
  },
  topLeftCorner: {
    top: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: moderateScale(8),
    left: moderateScale(8),
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: moderateScale(8),
    right: moderateScale(8),
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});

export default ZoomablePhoto;
