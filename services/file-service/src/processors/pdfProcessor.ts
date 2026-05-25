import fs from 'fs/promises';

// @ts-ignore - pdf-parse has type issues
const pdf = require('pdf-parse');

export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
};

export const getPDFMetadata = async (filePath: string): Promise<{ pages: number }> => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return { pages: data.numpages };
  } catch (error) {
    console.error('PDF metadata error:', error);
    return { pages: 0 };
  }
};
