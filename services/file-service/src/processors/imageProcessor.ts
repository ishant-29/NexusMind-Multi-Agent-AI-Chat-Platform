import sharp from 'sharp';

export const getImageMetadata = async (filePath: string) => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (error) {
    console.error('Image metadata error:', error);
    return null;
  }
};

export const createThumbnail = async (
  filePath: string,
  outputPath: string,
  width: number = 200
): Promise<void> => {
  try {
    await sharp(filePath)
      .resize(width, null, { withoutEnlargement: true })
      .toFile(outputPath);
  } catch (error) {
    console.error('Thumbnail creation error:', error);
  }
};
