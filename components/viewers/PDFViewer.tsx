import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface PDFViewerProps {
  uri: string;
}

export default function PDFViewer({ uri }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleLoadEnd = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load PDF document');
  };
  
  // For web platform, we can directly embed the PDF
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe 
          src={`${uri}#view=FitH`}
          style={styles.webFrame}
          title="PDF Document"
        />
      </View>
    );
  }
  
  // For native platforms, we need to use a WebView with a PDF viewer
  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0C2340" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(uri)}` }}
          style={styles.webview}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  webview: {
    flex: 1,
  },
  webFrame: {
    width: '100%',
    height: '100%',
  } as any,
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7A869A',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
  },
});