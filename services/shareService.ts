import { Share, Alert, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
}

/**
 * Share content using the native share sheet
 */
export const shareContent = async (options: ShareOptions): Promise<void> => {
  try {
    const shareOptions: any = {};
    
    if (options.title) {
      shareOptions.title = options.title;
    }
    
    if (options.message) {
      shareOptions.message = options.message;
    }
    
    if (options.url) {
      shareOptions.url = options.url;
    }

    const result = await Share.share(shareOptions);
    
    if (result.action === Share.sharedAction) {
      console.log('Content shared successfully');
    } else if (result.action === Share.dismissedAction) {
      console.log('Share cancelled');
    }
  } catch (error) {
    console.error('Error sharing content:', error);
    Alert.alert('Error', 'Failed to share content. Please try again.');
  }
};

/**
 * Download a file from URL and return local file URI
 */
export const downloadFileToLocal = async (fileUrl: string, fileName: string): Promise<string> => {
  try {
    console.log('📥 Downloading file to local storage:', { fileUrl, fileName });
    
    if (Platform.OS === 'web') {
      // For web, we can't download to local storage, return the original URL
      return fileUrl;
    }

    // Clean filename to avoid issues with special characters
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileUri = `${FileSystem.documentDirectory}${cleanFileName}`;
    
    // Download the file
    const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);
    
    if (downloadResult.status === 200) {
      console.log('✅ File downloaded successfully to:', downloadResult.uri);
      return downloadResult.uri;
    } else {
      throw new Error(`Download failed with status: ${downloadResult.status}`);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Share a file using native sharing capabilities
 * This function will download the file first (on mobile) and then share the local copy
 */
export const shareFile = async (fileUrl: string, fileName?: string): Promise<void> => {
  try {
    console.log('📤 Attempting to share file:', { fileUrl, fileName });
    
    if (Platform.OS === 'web') {
      // For web, use the Web Share API if available, otherwise fallback to opening the URL
      if (navigator.share) {
        console.log('🌐 Using Web Share API');
        await navigator.share({
          title: fileName || 'Shared File',
          url: fileUrl,
        });
      } else {
        console.log('🌐 Fallback: Opening in new tab');
        // Fallback: Open in new tab
        window.open(fileUrl, '_blank');
      }
    } else {
      // For mobile platforms, download the file first and then share the local copy
      try {
        const localFileUri = await downloadFileToLocal(fileUrl, fileName || 'shared_file');
        
        // Check if expo-sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          console.log('📱 Using expo-sharing with local file');
          await Sharing.shareAsync(localFileUri, {
            dialogTitle: fileName ? `Share ${fileName}` : 'Share File',
            mimeType: getMimeType(fileName),
          });
        } else {
          console.log('📱 Fallback: Using React Native Share with file URI');
          // Fallback to React Native Share with local file URI
          await Share.share({
            title: fileName || 'Shared File',
            url: `file://${localFileUri}`,
          });
        }
      } catch (downloadError) {
        console.error('Failed to download file for sharing, falling back to URL sharing:', downloadError);
        // Fallback to sharing the URL if download fails
        await Share.share({
          title: fileName || 'Shared File',
          message: `Check out this file: ${fileName || 'shared file'}\n\n${fileUrl}`,
        });
      }
    }
    console.log('✅ Share completed successfully');
  } catch (error) {
    console.error('Error sharing file:', error);
    Alert.alert('Error', 'Failed to share file. Please try again.');
  }
};

/**
 * Get MIME type based on file extension
 */
const getMimeType = (fileName?: string): string => {
  if (!fileName) return 'application/octet-stream';
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'mp4':
      return 'video/mp4';
    case 'mp3':
      return 'audio/mpeg';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Download a file to the device's download folder (mobile only)
 */
export const downloadFile = async (fileUrl: string, fileName: string): Promise<void> => {
  try {
    console.log('📥 Starting file download:', { fileUrl, fileName });
    
    if (Platform.OS === 'web') {
      // For web, trigger download by opening in new tab with download attribute
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Web download triggered');
      return;
    }

    // For mobile platforms, download to the documents directory
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileUri = `${FileSystem.documentDirectory}${cleanFileName}`;
    
    console.log('📱 Downloading to mobile device:', fileUri);
    
    const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);
    
    if (downloadResult.status === 200) {
      console.log('✅ File downloaded successfully to:', downloadResult.uri);
      Alert.alert(
        'Download Complete',
        `File "${fileName}" has been downloaded successfully.`,
        [{ text: 'OK' }]
      );
    } else {
      throw new Error(`Download failed with status: ${downloadResult.status}`);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    Alert.alert('Download Error', 'Failed to download file. Please try again.');
    throw error;
  }
};

/**
 * Share a document file
 */
export const shareDocument = async (document: { id: string; name: string; url?: string }): Promise<void> => {
  console.log('📄 Sharing document:', document);
  
  if (document.url) {
    // If we have a direct URL to the file, use the file sharing method
    await shareFile(document.url, document.name);
  } else {
    // Fallback to text sharing if no URL is available
    const shareOptions: ShareOptions = {
      title: `Share Document: ${document.name}`,
      message: `Check out this document: ${document.name}\n\nDocument ID: ${document.id}`,
    };
    await shareContent(shareOptions);
  }
};

/**
 * Share a folder
 */
export const shareFolder = async (folder: { id: string; name: string; url?: string }): Promise<void> => {
  const shareOptions: ShareOptions = {
    title: `Share Folder: ${folder.name}`,
    message: `Check out this folder: ${folder.name}`,
  };

  if (folder.url) {
    shareOptions.url = folder.url;
  } else {
    shareOptions.message += `\n\nFolder ID: ${folder.id}`;
  }

  await shareContent(shareOptions);
};
