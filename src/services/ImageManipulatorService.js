import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export async function resizeImage(uri) {
  const imageContext = ImageManipulator.manipulate(uri);
  const renderedImage = await imageContext.resize({
    height: 250,
  }).renderAsync();

  const result = await renderedImage.saveAsync({
    format: SaveFormat.JPEG,
    base64: true,
  });

  new File(result.uri).delete();
  return result.base64;
}