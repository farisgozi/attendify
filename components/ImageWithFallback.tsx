import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface ImageWithFallbackProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  fallbackSource?: { uri: string } | number;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  retryable?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onLoadSuccess?: () => void;
  onLoadError?: (error: any) => void;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  source,
  fallbackSource,
  style,
  loadingComponent,
  errorComponent,
  retryable = true,
  maxRetries = 3,
  retryDelay = 2000,
  onLoadSuccess,
  onLoadError,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSource, setCurrentSource] = useState(source);
  
  // Reset states when source changes
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
    setCurrentSource(source);
  }, [source]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadSuccess = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoadSuccess) onLoadSuccess();
  };

  const handleLoadError = (error: any) => {
    console.error('Image loading error:', error);
    
    if (retryable && retryCount < maxRetries) {
      // Schedule retry with exponential backoff
      const backoffDelay = retryDelay * Math.pow(2, retryCount);
      console.log(`Retrying image load (${retryCount + 1}/${maxRetries}) in ${backoffDelay}ms`);
      
      setTimeout(() => {
        setRetryCount(retryCount + 1);
        // Force reload by creating a new source object with cache buster
        const cacheBuster = `?cache=${Date.now()}`;
        if (typeof currentSource === 'object' && 'uri' in currentSource) {
          const uri = currentSource.uri.split('?')[0]; // Remove any existing query params
          setCurrentSource({ uri: `${uri}${cacheBuster}` });
        }
      }, backoffDelay);
    } else {
      setIsLoading(false);
      setHasError(true);
      if (onLoadError) onLoadError(error);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
    // Force reload with cache buster
    if (typeof source === 'object' && 'uri' in source) {
      const uri = source.uri.split('?')[0]; // Remove any existing query params
      setCurrentSource({ uri: `${uri}?cache=${Date.now()}` });
    } else {
      setCurrentSource(source);
    }
  };

  // Render loading component
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        {loadingComponent || (
          <ActivityIndicator size="large" color="#4630EB" />
        )}
      </View>
    );
  }

  // Render error component or fallback image
  if (hasError) {
    if (fallbackSource) {
      return (
        <Image
          source={fallbackSource}
          style={style}
          {...props}
        />
      );
    }
    
    return (
      <View style={[styles.container, style]}>
        {errorComponent || (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load image</Text>
            {retryable && (
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }

  // Render the image
  return (
    <Image
      source={currentSource}
      style={style}
      onLoadStart={handleLoadStart}
      onLoad={handleLoadSuccess}
      onError={e => handleLoadError(e.nativeEvent.error)}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 10,
  },
  errorText: {
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4630EB',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default ImageWithFallback;