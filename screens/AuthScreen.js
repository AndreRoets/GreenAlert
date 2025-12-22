import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveToStorage } from '../services/storage';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';

// A more comprehensive list of world currencies with names
// prettier-ignore
const currencies = [
  { name: 'United States Dollar', code: 'USD', symbol: '$' }, { name: 'Euro', code: 'EUR', symbol: '€' }, { name: 'British Pound', code: 'GBP', symbol: '£' }, { name: 'Japanese Yen', code: 'JPY', symbol: '¥' }, { name: 'Canadian Dollar', code: 'CAD', symbol: 'C$' }, { name: 'Australian Dollar', code: 'AUD', symbol: 'A$' }, { name: 'Swiss Franc', code: 'CHF', symbol: 'CHF' }, { name: 'Indian Rupee', code: 'INR', symbol: '₹' }, { name: 'South African Rand', code: 'ZAR', symbol: 'R' },
  { name: 'UAE Dirham', code: 'AED', symbol: 'د.إ' }, { name: 'Afghan Afghani', code: 'AFN', symbol: '؋' }, { name: 'Albanian Lek', code: 'ALL', symbol: 'L' }, { name: 'Armenian Dram', code: 'AMD', symbol: '֏' }, { name: 'Netherlands Antillean Guilder', code: 'ANG', symbol: 'ƒ' }, { name: 'Angolan Kwanza', code: 'AOA', symbol: 'Kz' }, { name: 'Argentine Peso', code: 'ARS', symbol: '$' },
  { name: 'Aruban Florin', code: 'AWG', symbol: 'ƒ' }, { name: 'Azerbaijani Manat', code: 'AZN', symbol: '₼' }, { name: 'Bosnia-Herzegovina Convertible Mark', code: 'BAM', symbol: 'KM' }, { name: 'Barbadian Dollar', code: 'BBD', symbol: '$' }, { name: 'Bangladeshi Taka', code: 'BDT', symbol: '৳' }, { name: 'Bulgarian Lev', code: 'BGN', symbol: 'лв' }, { name: 'Bahraini Dinar', code: 'BHD', symbol: '.د.ب' },
  { name: 'Burundian Franc', code: 'BIF', symbol: 'FBu' }, { name: 'Bermudan Dollar', code: 'BMD', symbol: '$' }, { name: 'Brunei Dollar', code: 'BND', symbol: '$' }, { name: 'Bolivian Boliviano', code: 'BOB', symbol: 'Bs.' }, { name: 'Brazilian Real', code: 'BRL', symbol: 'R$' }, { name: 'Bahamian Dollar', code: 'BSD', symbol: '$' }, { name: 'Bhutanese Ngultrum', code: 'BTN', symbol: 'Nu.' },
  { name: 'Botswanan Pula', code: 'BWP', symbol: 'P' }, { name: 'Belarusian Ruble', code: 'BYN', symbol: 'Br' }, { name: 'Belize Dollar', code: 'BZD', symbol: 'BZ$' }, { name: 'Congolese Franc', code: 'CDF', symbol: 'FC' }, { name: 'Chilean Peso', code: 'CLP', symbol: '$' }, { name: 'Chinese Yuan', code: 'CNY', symbol: '¥' }, { name: 'Colombian Peso', code: 'COP', symbol: '$' },
  { name: 'Costa Rican Colón', code: 'CRC', symbol: '₡' }, { name: 'Cuban Peso', code: 'CUP', symbol: '$' }, { name: 'Cape Verdean Escudo', code: 'CVE', symbol: '$' }, { name: 'Czech Koruna', code: 'CZK', symbol: 'Kč' }, { name: 'Djiboutian Franc', code: 'DJF', symbol: 'Fdj' }, { name: 'Danish Krone', code: 'DKK', symbol: 'kr' }, { name: 'Dominican Peso', code: 'DOP', symbol: 'RD$' },
  { name: 'Algerian Dinar', code: 'DZD', symbol: 'د.ج' }, { name: 'Egyptian Pound', code: 'EGP', symbol: 'E£' }, { name: 'Eritrean Nakfa', code: 'ERN', symbol: 'Nfk' }, { name: 'Ethiopian Birr', code: 'ETB', symbol: 'Br' }, { name: 'Fijian Dollar', code: 'FJD', symbol: '$' }, { name: 'Falkland Islands Pound', code: 'FKP', symbol: '£' }, { name: 'Georgian Lari', code: 'GEL', symbol: '₾' },
  { name: 'Guernsey Pound', code: 'GGP', symbol: '£' }, { name: 'Ghanaian Cedi', code: 'GHS', symbol: 'GH₵' }, { name: 'Gibraltar Pound', code: 'GIP', symbol: '£' }, { name: 'Gambian Dalasi', code: 'GMD', symbol: 'D' }, { name: 'Guinean Franc', code: 'GNF', symbol: 'FG' }, { name: 'Guatemalan Quetzal', code: 'GTQ', symbol: 'Q' }, { name: 'Guyanaese Dollar', code: 'GYD', symbol: '$' },
  { name: 'Hong Kong Dollar', code: 'HKD', symbol: '$' }, { name: 'Honduran Lempira', code: 'HNL', symbol: 'L' }, { name: 'Croatian Kuna', code: 'HRK', symbol: 'kn' }, { name: 'Haitian Gourde', code: 'HTG', symbol: 'G' }, { name: 'Hungarian Forint', code: 'HUF', symbol: 'Ft' }, { name: 'Indonesian Rupiah', code: 'IDR', symbol: 'Rp' }, { name: 'Israeli New Shekel', code: 'ILS', symbol: '₪' },
  { name: 'Manx pound', code: 'IMP', symbol: '£' }, { name: 'Iraqi Dinar', code: 'IQD', symbol: 'ع.د' }, { name: 'Iranian Rial', code: 'IRR', symbol: '﷼' }, { name: 'Icelandic Króna', code: 'ISK', symbol: 'kr' }, { name: 'Jersey Pound', code: 'JEP', symbol: '£' }, { name: 'Jamaican Dollar', code: 'JMD', symbol: 'J$' }, { name: 'Jordanian Dinar', code: 'JOD', symbol: 'JD' },
  { name: 'Kenyan Shilling', code: 'KES', symbol: 'KSh' }, { name: 'Kyrgystani Som', code: 'KGS', symbol: 'с' }, { name: 'Cambodian Riel', code: 'KHR', symbol: '៛' }, { name: 'Comorian Franc', code: 'KMF', symbol: 'CF' }, { name: 'North Korean Won', code: 'KPW', symbol: '₩' }, { name: 'South Korean Won', code: 'KRW', symbol: '₩' }, { name: 'Kuwaiti Dinar', code: 'KWD', symbol: 'د.ك' },
  { name: 'Cayman Islands Dollar', code: 'KYD', symbol: '$' }, { name: 'Kazakhstani Tenge', code: 'KZT', symbol: '₸' }, { name: 'Laotian Kip', code: 'LAK', symbol: '₭' }, { name: 'Lebanese Pound', code: 'LBP', symbol: '£' }, { name: 'Sri Lankan Rupee', code: 'LKR', symbol: 'Rs' }, { name: 'Liberian Dollar', code: 'LRD', symbol: '$' }, { name: 'Lesotho Loti', code: 'LSL', symbol: 'L' },
  { name: 'Libyan Dinar', code: 'LYD', symbol: 'ل.د' }, { name: 'Moroccan Dirham', code: 'MAD', symbol: 'د.م.' }, { name: 'Moldovan Leu', code: 'MDL', symbol: 'L' }, { name: 'Malagasy Ariary', code: 'MGA', symbol: 'Ar' }, { name: 'Macedonian Denar', code: 'MKD', symbol: 'ден' }, { name: 'Myanma Kyat', code: 'MMK', symbol: 'K' }, { name: 'Mongolian Tugrik', code: 'MNT', symbol: '₮' },
  { name: 'Macanese Pataca', code: 'MOP', symbol: 'MOP$' }, { name: 'Mauritanian Ouguiya', code: 'MRU', symbol: 'UM' }, { name: 'Mauritian Rupee', code: 'MUR', symbol: '₨' }, { name: 'Maldivian Rufiyaa', code: 'MVR', symbol: 'Rf' }, { name: 'Malawian Kwacha', code: 'MWK', symbol: 'MK' }, { name: 'Mexican Peso', code: 'MXN', symbol: '$' }, { name: 'Malaysian Ringgit', code: 'MYR', symbol: 'RM' },
  { name: 'Mozambican Metical', code: 'MZN', symbol: 'MT' }, { name: 'Namibian Dollar', code: 'NAD', symbol: '$' }, { name: 'Nigerian Naira', code: 'NGN', symbol: '₦' }, { name: 'Nicaraguan Córdoba', code: 'NIO', symbol: 'C$' }, { name: 'Norwegian Krone', code: 'NOK', symbol: 'kr' }, { name: 'Nepalese Rupee', code: 'NPR', symbol: '₨' }, { name: 'New Zealand Dollar', code: 'NZD', symbol: '$' },
  { name: 'Omani Rial', code: 'OMR', symbol: '﷼' }, { name: 'Panamanian Balboa', code: 'PAB', symbol: 'B/.' }, { name: 'Peruvian Sol', code: 'PEN', symbol: 'S/.' }, { name: 'Papua New Guinean Kina', code: 'PGK', symbol: 'K' }, { name: 'Philippine Peso', code: 'PHP', symbol: '₱' }, { name: 'Pakistani Rupee', code: 'PKR', symbol: '₨' }, { name: 'Polish Zloty', code: 'PLN', symbol: 'zł' },
  { name: 'Paraguayan Guarani', code: 'PYG', symbol: '₲' }, { name: 'Qatari Rial', code: 'QAR', symbol: '﷼' }, { name: 'Romanian Leu', code: 'RON', symbol: 'lei' }, { name: 'Serbian Dinar', code: 'RSD', symbol: 'дин.' }, { name: 'Russian Ruble', code: 'RUB', symbol: '₽' }, { name: 'Rwandan Franc', code: 'RWF', symbol: 'R₣' }, { name: 'Saudi Riyal', code: 'SAR', symbol: '﷼' },
  { name: 'Solomon Islands Dollar', code: 'SBD', symbol: '$' }, { name: 'Seychellois Rupee', code: 'SCR', symbol: '₨' }, { name: 'Sudanese Pound', code: 'SDG', symbol: 'ج.س.' }, { name: 'Swedish Krona', code: 'SEK', symbol: 'kr' }, { name: 'Singapore Dollar', code: 'SGD', symbol: '$' }, { name: 'Saint Helena Pound', code: 'SHP', symbol: '£' }, { name: 'Sierra Leonean Leone', code: 'SLL', symbol: 'Le' },
  { name: 'Somali Shilling', code: 'SOS', symbol: 'S' }, { name: 'Surinamese Dollar', code: 'SRD', symbol: '$' }, { name: 'South Sudanese Pound', code: 'SSP', symbol: '£' }, { name: 'São Tomé and Príncipe Dobra', code: 'STN', symbol: 'Db' }, { name: 'Syrian Pound', code: 'SYP', symbol: '£' }, { name: 'Swazi Lilangeni', code: 'SZL', symbol: 'L' }, { name: 'Thai Baht', code: 'THB', symbol: '฿' },
  { name: 'Tajikistani Somoni', code: 'TJS', symbol: 'SM' }, { name: 'Turkmenistani Manat', code: 'TMT', symbol: 'T' }, { name: 'Tunisian Dinar', code: 'TND', symbol: 'د.ت' }, { name: 'Tongan Paʻanga', code: 'TOP', symbol: 'T$' }, { name: 'Turkish Lira', code: 'TRY', symbol: '₺' }, { name: 'Trinidad and Tobago Dollar', code: 'TTD', symbol: 'TT$' }, { name: 'Tuvaluan Dollar', code: 'TVD', symbol: '$' },
  { name: 'New Taiwan Dollar', code: 'TWD', symbol: 'NT$' }, { name: 'Tanzanian Shilling', code: 'TZS', symbol: 'TSh' }, { name: 'Ukrainian Hryvnia', code: 'UAH', symbol: '₴' }, { name: 'Ugandan Shilling', code: 'UGX', symbol: 'USh' }, { name: 'Uruguayan Peso', code: 'UYU', symbol: '$U' }, { name: 'Uzbekistan Som', code: 'UZS', symbol: 'soʻm' }, { name: 'Venezuelan Bolívar', code: 'VES', symbol: 'Bs.' },
  { name: 'Vietnamese Dong', code: 'VND', symbol: '₫' }, { name: 'Vanuatu Vatu', code: 'VUV', symbol: 'VT' }, { name: 'Samoan Tala', code: 'WST', symbol: 'WS$' }, { name: 'Central African CFA Franc', code: 'XAF', symbol: 'FCFA' }, { name: 'East Caribbean Dollar', code: 'XCD', symbol: '$' }, { name: 'Special Drawing Rights', code: 'XDR', symbol: 'SDR' }, { name: 'West African CFA Franc', code: 'XOF', symbol: 'CFA' },
  { name: 'CFP Franc', code: 'XPF', symbol: '₣' }, { name: 'Yemeni Rial', code: 'YER', symbol: '﷼' }, { name: 'Zambian Kwacha', code: 'ZMW', symbol: 'ZK' }
];

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState(currencies[0]); // Default to USD
  const [isCurrencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSignUp = async () => {
    // Basic validation
    if (!email || !password) {
      Alert.alert('Sign Up Failed', 'Please enter both email and password.');
      return;
    }
    // In a real app, you would have more robust validation and an API call here.
    // For now, we'll simulate a successful sign-up.
    const userSession = {
      isGuest: false,
      email: email,
      // In a real app, you'd get a token from your backend
      token: `fake-token-for-${email}`,
      currency: currency,
    };
    await saveToStorage('userSession', userSession);
    // Navigate to Profile Setup to get user's name
    navigation.replace('ProfileSetup', {
      userId: email, // Using email as a unique ID for now
      email: email,
    });
  };

  const handleGuest = async () => {
    const userSession = { isGuest: true, currency: currency };
    // We don't save the guest session to storage, so it's forgotten on app close.
    navigation.replace('Onboarding', { isGuest: true, currency: currency });
  };

  const filteredCurrencies = currencies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <AppText style={styles.header}>GreenAlert</AppText>
      <AppText style={styles.subHeader}>Welcome!</AppText>

      <View style={styles.inputGroup}>
        <AppInput
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={theme.textSecondary}
          style={{ color: theme.text }}
        />
        <AppInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={theme.textSecondary}
          style={{ marginTop: SIZES.base * 2, color: theme.text }}
        />
      </View>

      <TouchableOpacity
        style={[styles.currencyButton, { borderColor: theme.border }]}
        onPress={() => setCurrencyModalVisible(true)}
      >
        <AppText style={styles.currencyButtonText}>
          Currency: {currency.code} ({currency.symbol})
        </AppText>
      </TouchableOpacity>

      <AppButton title="Sign Up" onPress={handleSignUp} />
      <AppButton title="Continue as Guest" onPress={handleGuest} variant="secondary" />


      <Modal
        animationType="slide"
        transparent={true}
        visible={isCurrencyModalVisible}
        onRequestClose={() => {
          setCurrencyModalVisible(false);
          setSearchQuery(''); // Reset search on close
        }}
      >
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, paddingBottom: SIZES.padding + insets.bottom }]}>
            <AppText style={styles.modalHeader}>Select Currency</AppText>
            <AppInput
              placeholder="Search by country or currency code..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ marginBottom: SIZES.base * 2 }}
            />
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.currencyItem, { borderBottomColor: theme.border }]} onPress={() => {
                  setCurrency(item);
                  setCurrencyModalVisible(false);
                  setSearchQuery(''); // Reset search on select
                }}>
                  <AppText style={styles.currencyItemText}>{item.name} ({item.code}, {item.symbol})</AppText>
                </TouchableOpacity>
              )} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  header: { ...FONTS.h1, marginBottom: SIZES.base },
  subHeader: { ...FONTS.h3, marginBottom: SIZES.padding * 2 },
  inputGroup: { width: '100%', marginBottom: SIZES.padding },
  currencyButton: {
    width: '100%',
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  currencyButtonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: SIZES.padding,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    maxHeight: '80%',
  },
  modalHeader: {
    ...FONTS.h3,
    marginBottom: SIZES.padding,
    textAlign: 'center',
  },
  currencyItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  currencyItemText: {
    ...FONTS.body3,
    textAlign: 'center',
  },
});