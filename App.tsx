import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import getWeatherImage from './src/helpers/getWeatherImage';

interface WeatherData {
  current_weather: {
    temperature: number;
    weathercode: string;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: string[];
  };
}

interface LocationOption {
  name: string;
  latitude: number;
  longitude: number;
  admin1: string;
  country: string;
}

const App: React.FC = () => {
  const [location, setLocation] = useState<string>('Cuttack');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    fetchWeather(location);
  }, []);

  const fetchWeather = async (location: string) => {
    try {
      setLoading(true);
      setError(null);
      setLocationOptions([]);
      setModalVisible(false);

      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${location}`,
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError('Location not found');
        setLoading(false);
        return;
      }

      if (geoData.results.length > 1) {
        setLocationOptions(geoData.results);
        setModalVisible(true);
        setLoading(false);
        return;
      }

      const {latitude, longitude} = geoData.results[0];
      fetchWeatherData(latitude, longitude, location);
    } catch (err) {
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const fetchWeatherData = async (
    latitude: number,
    longitude: number,
    location: string,
  ) => {
    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`,
      );
      const weatherJson = await weatherResponse.json();
      setWeatherData(weatherJson);
      setLocation(location);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  const handleLocationSelect = (option: LocationOption) => {
    setModalVisible(false);
    fetchWeatherData(option.latitude, option.longitude, option.name);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchWeather(searchQuery);
    } else {
      Alert.alert('Error', 'Please enter a location');
    }
  };

  const goBack = () => {
    setError('');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={goBack}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentWeather = weatherData?.current_weather;
  const dailyForecast = weatherData?.daily;

  const averageTemperature =
    dailyForecast?.temperature_2m_max.reduce((a, b) => a + b, 0) /
    dailyForecast?.temperature_2m_max.length;

  return (
    <View style={styles.container}>
      <Text style={styles.locationText}>{location}</Text>
      <Text style={styles.temperatureText}>
        {currentWeather?.temperature}°C
      </Text>
      {currentWeather ? (
        <Image
          style={styles.weatherImage}
          source={{uri: getWeatherImage(currentWeather.weathercode)}}
        />
      ) : (
        <></>
      )}
      {averageTemperature ? (
        <Text style={styles.averageText}>
          Average Temperature: {Math.round(averageTemperature)}°C
        </Text>
      ) : (
        <></>
      )}

      <FlatList
        data={dailyForecast?.temperature_2m_max}
        renderItem={({item, index}) => (
          <View style={styles.dailyForecast}>
            <Text>
              Day {index + 1}: {item}°C
            </Text>
            {dailyForecast?.weathercode[index] && (
              <Image
                style={styles.weatherImageSmall}
                source={{
                  uri: getWeatherImage(dailyForecast.weathercode[index]),
                }}
              />
            )}
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter location"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <TouchableOpacity style={styles.button} onPress={handleSearch}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Location</Text>
            <FlatList
              data={locationOptions}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleLocationSelect(item)}>
                  <Text style={styles.optionText}>
                    {item.name}, {item.admin1}, {item.country}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(_, index) => index.toString()}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  locationText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  temperatureText: {
    fontSize: 48,
    fontWeight: '300',
    marginVertical: 10,
  },
  weatherImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  averageText: {
    fontSize: 24,
    marginVertical: 10,
  },
  dailyForecast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  weatherImageSmall: {
    width: 50,
    height: 50,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginVertical: 10,
    width: '100%',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionButton: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  optionText: {
    fontSize: 16,
  },
});

export default App;
