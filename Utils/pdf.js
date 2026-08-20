import { Platform, ToastAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import BASE_URL, { IMAGE_FILEPATH_URL } from '../Urls/DomainUrl';

/**
 * The API is inconsistent about the key it uses for a generated PDF
 * (invoiceURL / invoicePDFurl / receiptPDFurl / receiptURL ...), so every
 * screen resolves the link through here instead of hard-coding one name.
 */
const PDF_KEYS = [
  'receiptPDFurl', 'receiptPdfUrl', 'receiptPDFUrl', 'receiptPdfurl',
  'receiptURL', 'receiptUrl', 'receipturl', 'receiptPDF', 'receiptPdf',
  'invoicePDFurl', 'invoicePdfUrl', 'invoicePDFUrl', 'invoicePdfurl',
  'invoiceURL', 'invoiceUrl', 'invoiceurl', 'invoicePDF', 'invoicePdf',
  'pdfUrl', 'pdfURL', 'pdfurl', 'pdfLink', 'pdfPath', 'pdf',
  'fileUrl', 'fileURL', 'fileurl', 'filePath', 'file', 'url',
];

const looksLikePdf = (value) =>
  typeof value === 'string' && /\.pdf(\?|#|$)/i.test(value.trim());

/** Turn a server-relative path ("/public/invoice/x.pdf", "invoice/x.pdf") into a full URL. */
const absolutize = (value) => {
  const url = String(value).trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = IMAGE_FILEPATH_URL.replace(/\/+$/, '');
  const path = url.replace(/^\/?(public\/)?/i, '');
  return `${base}/${path}`;
};

/** Depth-limited scan for any string that ends in .pdf, whatever its key is called. */
const deepFindPdf = (node, depth = 0) => {
  if (!node || depth > 3) return null;
  if (looksLikePdf(node)) return node;
  if (Array.isArray(node)) {
    for (const entry of node) {
      const hit = deepFindPdf(entry, depth + 1);
      if (hit) return hit;
    }
    return null;
  }
  if (typeof node === 'object') {
    for (const value of Object.values(node)) {
      const hit = deepFindPdf(value, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
};

/**
 * Pull a usable PDF link out of an invoice / receipt object.
 * Returns an absolute URL, or null when the record genuinely has no PDF.
 */
export function resolvePdfUrl(source) {
  if (!source || typeof source !== 'object') return null;

  for (const key of PDF_KEYS) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return absolutize(value);
  }

  const scanned = deepFindPdf(source);
  if (scanned) return absolutize(scanned);

  return null;
}

function toast(message) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('', message);
  }
}

/** Strip anything a filesystem would choke on. */
const safeBaseName = (name, fallback) => {
  const cleaned = String(name || '').replace(/[^a-zA-Z0-9_-]/g, '');
  return cleaned || fallback;
};

/**
 * Download a PDF and hand it to the user.
 * Android: saves through the Storage Access Framework, falling back to the
 * share sheet if the folder picker is dismissed. iOS: share sheet (Save to Files).
 */
export async function downloadPdf({ url, baseName, fallbackName = 'document', onToast = toast }) {
  if (!url) {
    onToast('No PDF available yet. Please try again later.');
    return false;
  }

  const name = safeBaseName(baseName, fallbackName);
  const fileUri = `${FileSystem.cacheDirectory}${name}.pdf`;

  const download = FileSystem.createDownloadResumable(url, fileUri);
  const result = await download.downloadAsync();

  if (!result?.uri) throw new Error('Download failed');
  if (result.status && result.status !== 200) {
    throw new Error(`Server returned ${result.status}`);
  }

  return savePdfFile({ sourceUri: result.uri, name, onToast });
}

/* ------------------------------------------------------------------ *
 * On-demand documents
 *
 * The stored PDF fields (invoiceURL / receiptPDFurl) are always null —
 * the backend never generates files. Instead it renders the document on
 * request as HTML, which we print to a PDF locally. This works for both
 * paid and unpaid documents.
 * ------------------------------------------------------------------ */

export const DOC_TYPE = { invoice: 'invoice', receipt: 'receipt' };

/**
 * The server template emits image tags as `src="...png%22 alt="..."` — the
 * closing quote is URL-encoded, which swallows the rest of the tag and leaves
 * the header/signature images blank. Repair those before printing.
 */
export function sanitizeTemplateHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/(\.(?:png|jpe?g|gif|webp|svg))%22/gi, '$1"');
}

/** A4 at 96dpi — the width expo-print lays the page out at. */
const PAGE_WIDTH_PX = 794;

/**
 * The template ships `width=device-width`, so a WebView reflows it to phone
 * width and it looks nothing like the printed PDF. Pin the viewport to the
 * page width instead — the WebView then scales the whole page down to fit,
 * giving the same layout the download produces.
 */
export function toPrintPreviewHtml(html) {
  if (!html || typeof html !== 'string') return '';

  const viewport = `<meta name="viewport" content="width=${PAGE_WIDTH_PX}">`;
  let out = /<meta\s+name=["']viewport["'][^>]*>/i.test(html)
    ? html.replace(/<meta\s+name=["']viewport["'][^>]*>/i, viewport)
    : html.replace(/<head([^>]*)>/i, `<head$1>${viewport}`);

  const pageCss = `<style>
    html, body { background: #fff; -webkit-text-size-adjust: 100%; }
    body { width: ${PAGE_WIDTH_PX}px !important; margin: 0 auto !important; }
    img { max-width: 100%; }
    table { table-layout: fixed; word-wrap: break-word; }
  </style>`;

  return /<\/head>/i.test(out)
    ? out.replace(/<\/head>/i, `${pageCss}</head>`)
    : `${pageCss}${out}`;
}

/** Ask the server to render an invoice / receipt and return its HTML. */
export async function fetchTemplateHtml({ id, type, onUnauthorized }) {
  if (!id) throw new Error('Missing document id');

  const token = await AsyncStorage.getItem('token');
  if (!token) {
    onUnauthorized?.();
    throw new Error('Session expired');
  }

  const myHeaders = new Headers();
  myHeaders.append('Authorization', 'Bearer ' + token);
  myHeaders.append('Content-Type', 'application/json');

  const response = await fetch(`${BASE_URL}/admin/htmlTemplateGenerator`, {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify({ _id: id, type }),
    redirect: 'follow',
  });
  const result = await response.json();

  if (result.statusCode === 401) {
    onUnauthorized?.();
    throw new Error('Session expired');
  }
  if (result.statusCode !== 200) {
    throw new Error(result.message || 'Could not generate the document');
  }

  const html = sanitizeTemplateHtml(result?.data?.html);
  if (!html) throw new Error('The server returned an empty document');
  return html;
}

/**
 * Android remembers the folder the user picks the first time, so every later
 * download lands there in one tap with no picker and no share sheet.
 */
const SAVE_DIR_KEY = 'pdfSaveDirectoryUri';

async function getAndroidSaveDirectory({ forcePrompt = false } = {}) {
  if (!forcePrompt) {
    const stored = await AsyncStorage.getItem(SAVE_DIR_KEY);
    if (stored) return stored;
  }
  const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) return null;
  await AsyncStorage.setItem(SAVE_DIR_KEY, permissions.directoryUri);
  return permissions.directoryUri;
}

/** Forget the saved folder so the next download asks for a new one. */
export async function resetSaveDirectory() {
  await AsyncStorage.removeItem(SAVE_DIR_KEY);
}

async function writeIntoDirectory(directoryUri, name, base64Data) {
  const safUri = await FileSystem.StorageAccessFramework.createFileAsync(
    directoryUri,
    name,
    'application/pdf'
  );
  await FileSystem.writeAsStringAsync(safUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return safUri;
}

async function saveOnAndroid(sourceUri, name, onToast) {
  let directoryUri = await getAndroidSaveDirectory();
  if (!directoryUri) {
    onToast('Choose a folder to save downloads.');
    return false;
  }

  const base64Data = await FileSystem.readAsStringAsync(sourceUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  try {
    await writeIntoDirectory(directoryUri, name, base64Data);
  } catch (error) {
    // The remembered folder was revoked or removed — ask once, then retry.
    directoryUri = await getAndroidSaveDirectory({ forcePrompt: true });
    if (!directoryUri) {
      onToast('Choose a folder to save downloads.');
      return false;
    }
    await writeIntoDirectory(directoryUri, name, base64Data);
  }

  onToast(`${name}.pdf saved.`);
  return true;
}

/** iOS: drop the file straight into the app's Documents folder (visible in Files). */
async function saveOnIos(sourceUri, name, onToast) {
  const destination = `${FileSystem.documentDirectory}${name}.pdf`;
  const existing = await FileSystem.getInfoAsync(destination);
  if (existing.exists) await FileSystem.deleteAsync(destination, { idempotent: true });
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  onToast(`${name}.pdf saved to Files.`);
  return true;
}

/** Save a already-downloaded/printed file, with no share sheet on either platform. */
async function savePdfFile({ sourceUri, name, onToast }) {
  return Platform.OS === 'android'
    ? saveOnAndroid(sourceUri, name, onToast)
    : saveOnIos(sourceUri, name, onToast);
}

/** Print HTML to a PDF and save it directly. */
export async function saveHtmlAsPdf({ html, baseName, fallbackName = 'document', onToast = toast }) {
  const name = safeBaseName(baseName, fallbackName);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (!uri) throw new Error('Could not create the PDF');
  return savePdfFile({ sourceUri: uri, name, onToast });
}

/**
 * Generate and save an invoice / receipt PDF in one call.
 * Prefers a stored PDF link when the backend ever starts providing one,
 * otherwise renders the document on demand.
 */
export async function downloadDocumentPdf({ id, type, source, baseName, fallbackName, onToast = toast, onUnauthorized }) {
  const storedUrl = resolvePdfUrl(source);
  if (storedUrl) {
    return downloadPdf({ url: storedUrl, baseName, fallbackName, onToast });
  }
  const html = await fetchTemplateHtml({ id, type, onUnauthorized });
  return saveHtmlAsPdf({ html, baseName, fallbackName, onToast });
}
