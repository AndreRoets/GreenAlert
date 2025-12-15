import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Saves a value to AsyncStorage.
 * @param {string} key The key to save the value under.
 * @param {any} value The value to save (will be stringified).
 */
export const saveToStorage = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Failed to save data to storage', e);
  }
};

/**
 * Loads a value from AsyncStorage.
 * @param {string} key The key to load the value from.
 * @returns {Promise<any>} The parsed value, or null if not found or on error.
 */
export const loadFromStorage = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load data from storage', e);
    return null;
  }
};