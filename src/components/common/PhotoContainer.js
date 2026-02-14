import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import ImageZoom from 'react-native-image-pan-zoom';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  normalizeUri as normalizeIpfsUri,
  buildIpfsCandidates,
} from '../../utils/normalizedUri';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive helper functions
const isTablet = SCREEN_WIDTH >= 768;
const isSmallPhone = SCREEN_WIDTH < 375; // Increased from 350

const getResponsiveSize = (small, medium, large) => {
  if (isSmallPhone) {
    return small;
  }
  if (isTablet) {
    return large;
  }
  return medium;
};

const getDynamicPhotoHeight = () => {
  const isPortrait = SCREEN_HEIGHT >= SCREEN_WIDTH;
  const maxHeight = SCREEN_HEIGHT * (isTablet ? 0.55 : isPortrait ? 0.4 : 0.5);
  const minHeight = getResponsiveSize(180, 220, 260);
  return Math.min(maxHeight, Math.max(minHeight, SCREEN_HEIGHT * 0.35));
};

// Constantes calculadas fuera de los worklets
const PHOTO_HEIGHT = getDynamicPhotoHeight();
const CONTAINER_PADDING = getResponsiveSize(2, 4, 6);
const CORNER_SIZE = getResponsiveSize(12, 20, 25);
const CORNER_BORDER_WIDTH = 2;
const BORDER_RADIUS = getResponsiveSize(2, 4, 6);
const CONTAINER_BORDER_RADIUS = getResponsiveSize(4, 8, 10);
const MARGIN_BOTTOM = getResponsiveSize(4, 16, 20);
const ASPECT_HEIGHT = getResponsiveSize(170, 190, 220);

const ROTATE_BTN = getResponsiveSize(32, 38, 44);


export const PhotoContainer = ({
  testID = 'photoContainer',
  photoUri,
  enableZoom = false,
  useAspectRatio = false,
}) => {
  if (enableZoom) {
    return (
      <ZoomablePhotoContainer
        testID={testID}
        photoUri={photoUri}
        useAspectRatio={useAspectRatio}
      />
    );
  }

  const baseUri = useMemo(() => normalizeIpfsUri(photoUri), [photoUri]);
  const candidates = useMemo(
    () => buildIpfsCandidates(baseUri).filter(Boolean),
    [baseUri],
  );
  const [tryIndex, setTryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setTryIndex(0);
    setIsLoading(true);
  }, [baseUri]);
  const withCacheBust = (url, idx) =>
    url + (url.includes('?') ? '&' : '?') + 'v=' + idx;
  const currentUri = useMemo(
    () =>
      candidates[tryIndex]
        ? withCacheBust(candidates[tryIndex], tryIndex)
        : null,
    [candidates, tryIndex],
  );
  useEffect(() => {
    if (currentUri) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [currentUri]);

  return (
    <View
      testID={testID}
      style={
        useAspectRatio
          ? styles.photoContainerAspectRatio
          : styles.photoContainer
      }>
      <Image
        testID={`${testID}Image`}
        source={{ uri: currentUri }}
        style={useAspectRatio ? styles.photoAspectRatio : styles.photo}
        resizeMode="contain"
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          if (tryIndex < candidates.length - 1) {
            setTryIndex(i => i + 1);
            setIsLoading(true);
          } else {
            setIsLoading(false);
          }
        }}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#41A44D" />
        </View>
      )}
      <View
        testID={`${testID}TopLeftCorner`}
        style={[styles.cornerBorder, styles.topLeftCorner]}
      />
      <View
        testID={`${testID}TopRightCorner`}
        style={[styles.cornerBorder, styles.topRightCorner]}
      />
      <View
        testID={`${testID}BottomLeftCorner`}
        style={[styles.cornerBorder, styles.bottomLeftCorner]}
      />
      <View
        testID={`${testID}BottomRightCorner`}
        style={[styles.cornerBorder, styles.bottomRightCorner]}
      />
    </View>
  );
};

const ZoomablePhotoContainer = ({
  testID = 'zoomablePhotoContainer',
  photoUri,
  useAspectRatio = false,
}) => {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [img, setImg] = useState({ w: 0, h: 0 });
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const zoomRef = useRef(null);
  const metricsKeyRef = useRef('');

  const onLayout = useCallback(e => {
    const { width, height } = e.nativeEvent.layout;
    const next = { w: Math.round(width), h: Math.round(height) };
    setBox(next);
  }, [testID]);

  const baseUri = useMemo(() => normalizeIpfsUri(photoUri), [photoUri]);
  const candidates = useMemo(
    () => buildIpfsCandidates(baseUri).filter(Boolean),
    [baseUri],
  );
  const [tryIndex, setTryIndex] = useState(0);
  useEffect(() => {
    setTryIndex(0);
    setIsLoading(true);
  }, [baseUri]);
  const withCacheBust = (url, idx) =>
    url + (url.includes('?') ? '&' : '?') + 'v=' + idx;
  const currentUri = useMemo(
    () =>
      candidates[tryIndex]
        ? withCacheBust(candidates[tryIndex], tryIndex)
        : null,
    [candidates, tryIndex],
  );

  useEffect(() => {
    if (currentUri) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [currentUri]);

  useEffect(() => {
    if (!currentUri) return;
    Image.getSize(
      currentUri,
      (w, h) => {
        setImg({ w, h });

      },
      () => {
        if (tryIndex < candidates.length - 1) {
          setTryIndex(i => i + 1);
        } else {
          setImg({ w: 1, h: 1 });
          setIsLoading(false);
        }
      },
    );
  }, [candidates.length, currentUri, testID, tryIndex]);
  const isRotated = rotation % 180 !== 0;
  const baseIw = isRotated ? img.h : img.w;
  const baseIh = isRotated ? img.w : img.h;
  const rotateLeft = () => setRotation(prev => (prev + 270) % 360); // -90°
  const rotateRight = () => setRotation(prev => (prev + 90) % 360);

  const getContained = (iw, ih, cw, ch) => {
    if (!iw || !ih || !cw || !ch) return { width: cw, height: ch };
    const rImg = iw / ih;
    const rBox = cw / ch;
    if (rImg > rBox) {
      const width = cw;
      const height = width / rImg;
      return { width, height };
    } else {
      const height = ch;
      const width = height * rImg;
      return { width, height };
    }
  };

  const fit = getContained(baseIw, baseIh, box.w, box.h);

  const contentW = Math.round(fit.width || box.w);
  const contentH = Math.round(fit.height || box.h);


  const pixelScaleLimit = Math.max(
    1,
    Math.min(
      baseIw && contentW ? baseIw / contentW : 1,
      baseIh && contentH ? baseIh / contentH : 1,
    ),
  );
  const maxScaleFromPixels = Math.min(6, pixelScaleLimit);

  // Renderizamos la imagen a un tamaño mayor (hasta 2x) para mejorar nitidez al hacer zoom.
  // El usuario verá el "fit" inicial con una escala menor (zoomMinScale).
  const decodeScale = Math.max(1, Math.min(2, pixelScaleLimit));
  const zoomMinScale = isRotated ? 1 : 1 / decodeScale;
  const zoomMaxScale = Math.max(zoomMinScale, maxScaleFromPixels / decodeScale);

  /* const scaleToFill = useMemo(() => {
    if (!box.w || !box.h || !contentW || !contentH) return 1;
    const fillW = box.w / contentW;
    const fillH = box.h / contentH;
    const target = Math.max(1, Math.max(fillW, fillH));
    return Math.min(target, maxScaleFromPixels);
  }, [box.w, box.h, contentW, contentH, maxScaleFromPixels]); */

  /* const autoScale = useMemo(() => {
    // Evita que se vea "muy lejos" y también evita cortar demasiado.
    // Si el usuario quiere más/menos, puede ajustar con pinch.
    return 1;
  }, [scaleToFill]); */

  const rotatedContainerHeight = useMemo(() => {
    // Al girar 90°, un documento "portrait" se ve pequeño si el contenedor es bajo.
    // Preferimos aumentar altura (sin recortar) y dejar que el usuario haga pinch si desea.
    const factor = isTablet ? 0.85 : 0.92;
    const target = Math.round(SCREEN_HEIGHT * factor);
    return Math.max(PHOTO_HEIGHT, target);
  }, []);

  useEffect(() => {
    const metricsKey = [
      box.w,
      box.h,
      img.w,
      img.h,
      contentW,
      contentH,
      rotation,
      Number(decodeScale).toFixed(3),
      Number(zoomMinScale).toFixed(3),
      Number(zoomMaxScale).toFixed(3),
      isRotated ? 1 : 0,
    ].join('|');
    if (metricsKeyRef.current === metricsKey) return;
    metricsKeyRef.current = metricsKey;

  }, [
    box,
    contentH,
    contentW,
    decodeScale,
    img,
    isRotated,
    rotatedContainerHeight,
    rotation,
    testID,
    zoomMaxScale,
    zoomMinScale,
  ]);

  useEffect(() => {
    // pequeño timeout para asegurar layout previo
    const id = setTimeout(() => {
      const nextScale = zoomMinScale;
      zoomRef.current?.centerOn?.({ x: 0, y: 0, scale: nextScale, duration: 0 });

    }, 0);
    return () => clearTimeout(id);
  }, [rotation, testID, zoomMinScale]);

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[
        useAspectRatio
          ? styles.photoContainerZoomAspectRatio
          : styles.photoContainer,
        isTablet && styles.photoContainerFill,
        isTablet && isRotated && { height: rotatedContainerHeight },
      ]}>
      {box.w > 0 && box.h > 0 && img.w > 0 && img.h > 0 ? (
        <ImageZoom
          ref={zoomRef}
          cropWidth={box.w}
          cropHeight={box.h}
          imageWidth={contentW * decodeScale}
          imageHeight={contentH * decodeScale}
          minScale={zoomMinScale}
          maxScale={zoomMaxScale}
          enableCenterFocus={true}
          pinchToZoom
          panToMove
          enableDoubleClickZoom>
          <Image
            testID={`${testID}Image`}
            source={{ uri: currentUri }}
            style={{
              width: contentW * decodeScale,
              height: contentH * decodeScale,
              transform: [{ rotate: `${rotation}deg` }],
            }}
            resizeMode="contain"
            onLoadStart={() => {
              setIsLoading(true);

            }}
            onLoad={() => {
              setIsLoading(false);

            }}
            onError={() => {
              if (tryIndex < candidates.length - 1) {
                setTryIndex(i => i + 1);
                setIsLoading(true);

              } else {
                setIsLoading(false);

              }
            }}
          />
        </ImageZoom>
      ) : (
        // Render vacío mientras medimos: sin “salto”
        <View
          testID={`${testID}PlaceholderView`}
          style={{ width: '100%', height: PHOTO_HEIGHT }}
        />
      )}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#41A44D" />
        </View>
      )}
      <TouchableOpacity
        testID={`${testID}RotateLeft`}
        onPress={rotateLeft}
        activeOpacity={0.85}
        style={[styles.rotateBtn, styles.rotateLeftBtn]}
        accessibilityRole="button"
        accessibilityLabel="Girar 90 grados a la izquierda">
        <Ionicons
          name="refresh"
          size={getResponsiveSize(16, 20, 22)}
          color="#fff"
          style={{ transform: [{ scaleX: -1 }] }}
        />
      </TouchableOpacity>

      <TouchableOpacity
        testID={`${testID}RotateRight`}
        onPress={rotateRight}
        activeOpacity={0.85}
        style={[styles.rotateBtn, styles.rotateRightBtn]}
        accessibilityRole="button"
        accessibilityLabel="Girar 90 grados a la derecha">
        <Ionicons
          name="refresh"
          size={getResponsiveSize(16, 20, 22)}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Esquinas decorativas */}
      <View
        testID={`${testID}TopLeftCorner`}
        style={[styles.cornerBorder, styles.topLeftCorner]}
      />
      <View
        testID={`${testID}TopRightCorner`}
        style={[styles.cornerBorder, styles.topRightCorner]}
      />
      <View
        testID={`${testID}BottomLeftCorner`}
        style={[styles.cornerBorder, styles.bottomLeftCorner]}
      />
      <View
        testID={`${testID}BottomRightCorner`}
        style={[styles.cornerBorder, styles.bottomRightCorner]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: CONTAINER_BORDER_RADIUS,
    padding: CONTAINER_PADDING,
    marginBottom: MARGIN_BOTTOM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: PHOTO_HEIGHT,
  },
  photoWrapper: {
    width: '100%',
    height: PHOTO_HEIGHT,
  },
  photoWrapperAspectRatio: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  photo: {
    width: '100%',
    height: PHOTO_HEIGHT,
    borderRadius: BORDER_RADIUS,
  },
  photoContainerAspectRatio: {
    backgroundColor: '#fff',
    borderRadius: CONTAINER_BORDER_RADIUS,
    padding: CONTAINER_PADDING,
    marginBottom: MARGIN_BOTTOM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    minHeight: ASPECT_HEIGHT,
    maxHeight: ASPECT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoContainerZoomAspectRatio: {
    backgroundColor: '#fff',
    borderRadius: CONTAINER_BORDER_RADIUS,
    padding: CONTAINER_PADDING,
    marginBottom: MARGIN_BOTTOM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    minHeight: ASPECT_HEIGHT,
    height: ASPECT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAspectRatio: {
    width: '100%',
    minHeight: ASPECT_HEIGHT,
    maxHeight: ASPECT_HEIGHT,
    aspectRatio: 4 / 3, // Proporción estándar para imágenes de documentos
    borderRadius: BORDER_RADIUS,
  },
  cornerBorder: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#2F2F2F',
    borderWidth: CORNER_BORDER_WIDTH,
    zIndex: 1, // Para que estén por encima de la imagen
  },
  topLeftCorner: {
    top: CONTAINER_PADDING,
    left: CONTAINER_PADDING,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    top: CONTAINER_PADDING,
    right: CONTAINER_PADDING,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    bottom: CONTAINER_PADDING,
    left: CONTAINER_PADDING,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    bottom: CONTAINER_PADDING,
    right: CONTAINER_PADDING,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  photoContainerFill: {
    flex: 1,
    width: '100%',
  },
  rotateBtn: {
    position: 'absolute',
    width: ROTATE_BTN,
    height: ROTATE_BTN,
    borderRadius: ROTATE_BTN / 2,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  rotateLeftBtn: {
    left: getResponsiveSize(6, 8, 10),
    top: '50%',
    marginTop: -(ROTATE_BTN / 2),
  },
  rotateRightBtn: {
    right: getResponsiveSize(6, 8, 10),
    top: '50%',
    marginTop: -(ROTATE_BTN / 2),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
});

export default PhotoContainer;
