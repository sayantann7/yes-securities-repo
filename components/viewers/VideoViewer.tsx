import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';

interface VideoViewerProps {
  uri: string;
}

export default function VideoViewer({ uri }: VideoViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleLoadEnd = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load video');
  };
  
  // For web platform, we can use the native HTML5 video player
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <video 
          src={uri}
          style={styles.webVideo}
          controls
          autoPlay={false}
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onError={handleError}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0C2340" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
      </View>
    );
  }
  
  // For native platforms, embed the video in a WebView
  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0C2340" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <WebView
          source={{
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body, html {
                      margin: 0;
                      padding: 0;
                      height: 100%;
                      width: 100%;
                      background-color: #000;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                    }
                    video {
                      max-width: 100%;
                      max-height: 100%;
                    }
                  </style>
                </head>
                <body>
                  <video controls src="${uri}" playsinline></video>
                </body>
              </html>
            `
          }}
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
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  webVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
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