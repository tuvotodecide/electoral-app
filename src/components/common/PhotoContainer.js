import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';

import ImageZoom from 'react-native-image-pan-zoom';
import Ionicons from 'react-native-vector-icons/Ionicons';
const normalizeUri = u => {
  if (!u) return '';
  if (u.startsWith('ipfs://'))
    return `https://ipfs.io/ipfs/${u.replace('ipfs://', '')}`;
  if (
    u.startsWith('file://') ||
    u.startsWith('content://') ||
    /^https?:\/\//i.test(u)
  )
    return u;
  if (u[0] === '/' || /^[A-Za-z]:\\/.test(u)) return `file://${u}`;
  return u;
};

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

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
const ASPECT_HEIGHT = getResponsiveSize(200, 230, 260);
const ROTATE_BTN = getResponsiveSize(32, 38, 44);

export const PhotoContainer = ({
  photoUri,
  enableZoom = false,
  useAspectRatio = false,
}) => {
  if (enableZoom) {
    return (
      <ZoomablePhotoContainer
        photoUri={photoUri}
        useAspectRatio={useAspectRatio}
      />
    );
  }

  return (
    <View
      style={
        useAspectRatio
          ? styles.photoContainerAspectRatio
          : styles.photoContainer
      }>
      <Image
        source={{uri: normalizeUri(photoUri)}}
        style={useAspectRatio ? styles.photoAspectRatio : styles.photo}
        resizeMode="contain"
      />
      <View style={[styles.cornerBorder, styles.topLeftCorner]} />
      <View style={[styles.cornerBorder, styles.topRightCorner]} />
      <View style={[styles.cornerBorder, styles.bottomLeftCorner]} />
      <View style={[styles.cornerBorder, styles.bottomRightCorner]} />
    </View>
  );
};

const ZoomablePhotoContainer = ({photoUri, useAspectRatio = false}) => {
  const [box, setBox] = useState({w: 0, h: 0});
  const [img, setImg] = useState({w: 0, h: 0});
  const [rotation, setRotation] = useState(0);
  const zoomRef = useRef(null);

  const onLayout = useCallback(e => {
    const {width, height} = e.nativeEvent.layout;
    setBox({w: Math.round(width), h: Math.round(height)});
  }, []);

  const normalizedUri = normalizeUri(photoUri);

  useEffect(() => {
    if (!normalizedUri) return;
    Image.getSize(
      normalizedUri,
      (w, h) => setImg({w, h}),
      () => setImg({w: 1, h: 1}),
    );
  }, [normalizedUri]);
  const isRotated = rotation % 180 !== 0;
  const baseIw = isRotated ? img.h : img.w;
  const baseIh = isRotated ? img.w : img.h;
  const rotateLeft = () => setRotation(prev => (prev + 270) % 360); // -90°
  const rotateRight = () => setRotation(prev => (prev + 90) % 360);

  const getContained = (iw, ih, cw, ch) => {
    if (!iw || !ih || !cw || !ch) return {width: cw, height: ch};
    const rImg = iw / ih;
    const rBox = cw / ch;
    if (rImg > rBox) {
      const width = cw;
      const height = width / rImg;
      return {width, height};
    } else {
      const height = ch;
      const width = height * rImg;
      return {width, height};
    }
  };

  const fit = getContained(baseIw, baseIh, box.w, box.h);

  const coverScale =
    Math.max(
      (box.w || 1) / (fit.width || 1),
      (box.h || 1) / (fit.height || 1),
    ) || 1;

  const contentW = Math.round((fit.width || box.w) * coverScale);
  const contentH = Math.round((fit.height || box.h) * coverScale);

  const minScale = 1 / coverScale;
  const initialScale = 1;

  const pixelScaleLimit = Math.max(
    1,
    Math.min(
      img.w && contentW ? img.w / contentW : 1,
      img.h && contentH ? img.h / contentH : 1,
    ),
  );
  const maxScale = Math.min(8, Math.max(3, pixelScaleLimit));

  useEffect(() => {
    const id = setTimeout(() => {
      // arrancar SIEMPRE en COVER
      zoomRef.current?.centerOn?.({
        x: 0,
        y: 0,
        scale: initialScale,
        duration: 0,
      });
    }, 0);
    return () => clearTimeout(id);
  }, [rotation, box.w, box.h, img.w, img.h]);

  return (
    <View
      onLayout={onLayout}
      style={[
        useAspectRatio
          ? styles.photoContainerAspectRatio
          : styles.photoContainer,
        isTablet && styles.photoContainerFill,
      ]}>
      {box.w > 0 && box.h > 0 && img.w > 0 && img.h > 0 ? (
        <ImageZoom
          key={`${isRotated}-${box.w}x${box.h}-${img.w}x${img.h}`}
          ref={zoomRef}
          cropWidth={box.w}
          cropHeight={box.h}
          imageWidth={contentW}
          imageHeight={contentH}
          minScale={minScale}
          maxScale={maxScale || 3}
          enableCenterFocus={false}
          pinchToZoom
          panToMove
          enableDoubleClickZoom>
          <View
            style={{
              width: contentW,
              height: contentH,
            }}
            onStartShouldSetResponder={() => false}
            onMoveShouldSetResponder={() => false}
            collapsable={false}>
            <Image
              source={{uri: normalizedUri}}
              style={{
                width: '100%',
                height: '100%',
                transform: [{rotate: `${rotation}deg`}],
              }}
              resizeMode="contain"
            />
          </View>
        </ImageZoom>
      ) : (
        // Render vacío mientras medimos: sin “salto”
        <View style={{width: '100%', height: PHOTO_HEIGHT}} />
      )}
      <TouchableOpacity
        onPress={rotateLeft}
        activeOpacity={0.85}
        style={[styles.rotateBtn, styles.rotateLeftBtn]}
        accessibilityRole="button"
        accessibilityLabel="Girar 90 grados a la izquierda">
        <Ionicons
          name="refresh"
          size={getResponsiveSize(16, 20, 22)}
          color="#fff"
          style={{transform: [{scaleX: -1}]}}
        />
      </TouchableOpacity>

      <TouchableOpacity
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
    borderRadius: CONTAINER_BORDER_RADIUS,
    padding: CONTAINER_PADDING,
    marginBottom: MARGIN_BOTTOM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: 1},
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
});

export default PhotoContainer;
