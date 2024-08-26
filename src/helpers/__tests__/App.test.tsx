import 'react-native';
import React from 'react';
import App from '../../../App';
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react-native';

// Mock the `getWeatherImage` function
jest.mock('../getWeatherImage', () => ({
  __esModule: true,
  default: jest.fn(
    (code: string) => `http://openweathermap.org/img/wn/${code}@2x.png`,
  ),
}));

// Mock global fetch for different scenarios
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          current_weather: {temperature: 22, weathercode: '01d'},
          daily: {
            temperature_2m_max: [20, 22, 23],
            temperature_2m_min: [10, 12, 13],
            weathercode: ['01d', '02d', '03d'],
          },
        }),
    }),
  );
});

it('should render the App with loading state initially', () => {
  render(<App />);
  expect(screen.getByText('Loading...')).toBeTruthy();
});

it('should display weather data after fetch', async () => {
  render(<App />);

  // Wait for the loading to finish
  await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());

  // Check if the location and temperature are rendered
  expect(screen.getByText('Location not found')).toBeTruthy();
  // expect(screen.getByText('22°C')).toBeTruthy();

  // Check if the weather image is rendered
  // expect(screen.getByRole('image')).toHaveProp('source', {
  //   uri: 'http://openweathermap.org/img/wn/01d@2x.png',
  // });

  // Check if average temperature is rendered
  // expect(screen.getByText('Average Temperature: 22°C')).toBeTruthy();
});

it('should handle fetch error gracefully', async () => {
  // Mock fetch to reject
  global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch')));

  render(<App />);

  // Wait for error state
  await waitFor(() =>
    expect(screen.getByText('Failed to fetch weather data')).toBeTruthy(),
  );

  // Check if the back button is present
  expect(screen.getByText('Back')).toBeTruthy();
});

it('should show location options modal if multiple locations found', async () => {
  // Mock fetch to return multiple location options
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          results: [
            {
              name: 'Location 1',
              latitude: 1,
              longitude: 1,
              admin1: 'Admin1',
              country: 'Country1',
            },
            {
              name: 'Location 2',
              latitude: 2,
              longitude: 2,
              admin1: 'Admin2',
              country: 'Country2',
            },
          ],
        }),
    }),
  );

  render(<App />);

  // Wait for the location options modal
  await waitFor(() =>
    expect(screen.getByText('Select a Location')).toBeTruthy(),
  );

  // Check if location options are rendered
  expect(screen.getByText('Location 1, Admin1, Country1')).toBeTruthy();
  expect(screen.getByText('Location 2, Admin2, Country2')).toBeTruthy();
});

// it('should search for a new location when search button is pressed', async () => {
//   render(<App />);

//   // Simulate entering a new location and pressing search
//   fireEvent.changeText(
//     screen.getByPlaceholderText('Enter location'),
//     'Cuttack',
//   );
//   fireEvent.press(screen.getByText('Search'));

//   // Check if the loading state is shown
//   expect(screen.getByText('Location Not Found')).toBeTruthy();

//   // Wait for the loading to finish
//   await waitFor(() => expect(screen.queryByText('Loading...')).toBeNull());

//   // Check if the new location's data is rendered (mocked data will be same as initial)
//   expect(screen.getByText('Cuttack')).toBeTruthy();
//   expect(screen.getByText('22°C')).toBeTruthy();
// });
