import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { saveToStorage } from '../services/storage';

export default function LeftoverBudgetScreen({ route, navigation }) {
  const { unallocated, paymentDay, activeCategories, isGuest } = route.params;
  const [view, setView] = useState(null); // 'daily' or 'weekly'
  const [isCustomizeModalVisible, setCustomizeModalVisible] = useState(false);
  const [isSavingsModalVisible, setSavingsModalVisible] = useState(false);

  const [savingsGoal, setSavingsGoal] = useState('');
  const [dailyBudgets, setDailyBudgets] = useState([]);
  const [weeklyBudgets, setWeeklyBudgets] = useState([]);

  // This flag tracks if the user has entered the customization modal
  const [hasCustomized, setHasCustomized] = useState(false);

  const calculateDaysLeft = (payDay) => {
    if (!payDay) return 0;

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let periodEndDate;
    if (currentDay < payDay) {
      periodEndDate = new Date(currentYear, currentMonth, payDay - 1);
    } else {
      const nextMonth = new Date(today);
      nextMonth.setMonth(currentMonth + 1);
      periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), payDay - 1);
    }
    const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysLeft(paymentDay);
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

  const savingsAmount = parseFloat(savingsGoal) || 0;
  const spendableUnallocated = unallocated - savingsAmount;

  // Prevent division by zero if there are no days/weeks left
  const weeklyAverage = weeksLeft > 0 ? spendableUnallocated / weeksLeft : 0;
  const dailyAverage = daysLeft > 0 ? spendableUnallocated / daysLeft : 0;

  // Calculate savings per period
  const dailySavings = daysLeft > 0 ? savingsAmount / daysLeft : 0;
  const weeklySavings = weeksLeft > 0 ? savingsAmount / weeksLeft : 0;

  const allocatedSum = useMemo(() => {
    if (!hasCustomized) return 0;
    const budgets = view === 'daily' ? dailyBudgets : (view === 'weekly' ? weeklyBudgets : []);
    return budgets.reduce((sum, val) => sum + (parseFloat(val) || 0), 0) || 0;
  }, [view, dailyBudgets, weeklyBudgets, hasCustomized]);

  const remainingToAllocate = spendableUnallocated - allocatedSum;

  const handleSelectView = (selectedView) => {
    if (view === selectedView) {
      setView(null); // Allow un-selecting
    } else {
      setView(selectedView);
      setHasCustomized(false); // Reset customization when view changes
      // Initialize budget arrays when view is selected
      if (selectedView === 'daily') {
        setDailyBudgets(Array(daysLeft).fill(''));
      } else if (selectedView === 'weekly') {
        setWeeklyBudgets(Array(weeksLeft).fill(''));
      }
    }
  };

  const handleBudgetChange = (index, amount) => {
    if (!/^\d*\.?\d*$/.test(amount)) return;

    if (view === 'daily') {
      const newBudgets = [...dailyBudgets];
      newBudgets[index] = amount;
      setDailyBudgets(newBudgets);
    } else if (view === 'weekly') {
      const newBudgets = [...weeklyBudgets];
      newBudgets[index] = amount;
      setWeeklyBudgets(newBudgets);
    }
  };

  const handleSavingsChange = (amount) => {
    if (!/^\d*\.?\d*$/.test(amount)) return;
    const numericAmount = parseFloat(amount) || 0;
    // Ensure savings goal doesn't exceed unallocated amount
    setSavingsGoal(numericAmount > unallocated ? unallocated.toString() : amount);
  };

  const handleDone = async () => {
    if (!view) {
      Alert.alert("Selection Needed", "Please select a daily or weekly budget view.");
      return;
    }

    // If user customized, save the detailed budgets. Otherwise, they will be undefined.
    const budgetData = {
      total: unallocated,
      paymentDay: paymentDay,
      savingsGoal: savingsAmount,
      viewPreference: view,
      dailyBudgets: view === 'daily' && hasCustomized ? dailyBudgets.map(b => parseFloat(b) || 0) : undefined,
      weeklyBudgets: view === 'weekly' && hasCustomized ? weeklyBudgets.map(b => parseFloat(b) || 0) : undefined,
    };

    if (!isGuest) {
      await saveToStorage('userBudget', budgetData);
      await saveToStorage('userCategories', activeCategories);
      await saveToStorage('hasCompletedOnboarding', true);
    }

    // Navigate to the next step
    navigation.navigate('RecurringSpends', {
      budget: budgetData,
      activeCategories,
      isGuest,
    });
  };

  const formatDateForDay = (dayIndex) => {
    const date = new Date();
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Budget Your Leftover Money</Text>

        <View style={styles.leftoverContainer}>
          <Text style={styles.leftoverLabel}>Money Left Over</Text>
          <Text style={styles.leftoverAmount}>${unallocated.toFixed(2)}</Text>
          <Text style={styles.remainingText}>for the next {daysLeft} days</Text>
        </View>

        <TouchableOpacity style={styles.savingsButton} onPress={() => setSavingsModalVisible(true)}>
          <Text style={styles.savingsButtonText}>
            {savingsAmount > 0 ? `Edit Savings Goal ($${savingsAmount.toFixed(2)})` : 'Set a Savings Goal'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.subHeader}>Spendable: <Text style={styles.bold}>${spendableUnallocated.toFixed(2)}</Text></Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionButton, view === 'daily' && styles.selectedOption]}
            onPress={() => handleSelectView('daily')}
          >
            <Text style={[styles.optionText, view === 'daily' && styles.selectedOptionText]}>Budget Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, view === 'weekly' && styles.selectedOption]}
            onPress={() => handleSelectView('weekly')}
          >
            <Text style={[styles.optionText, view === 'weekly' && styles.selectedOptionText]}>Budget Weekly</Text>
          </TouchableOpacity>
        </View>

        {view === 'daily' && (
          <View style={styles.resultContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Daily Fun Money:</Text>
              <Text style={styles.resultAmount}>${dailyAverage.toFixed(2)}</Text>
              <Text style={styles.resultLabel}>Daily Savings:</Text>
              <Text style={[styles.resultAmount, { color: '#007AFF' }]}>${dailySavings.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.customizeButton} onPress={() => { setCustomizeModalVisible(true); setHasCustomized(true); }}>
              <Text style={styles.customizeButtonText}>Customize Allocation</Text>
            </TouchableOpacity>
          </View>
        )}

        {view === 'weekly' && (
          <View style={styles.resultContainer}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Weekly Fun Money:</Text>
              <Text style={styles.resultAmount}>${weeklyAverage.toFixed(2)}</Text>
              <Text style={styles.resultLabel}>Weekly Savings:</Text>
              <Text style={[styles.resultAmount, { color: '#007AFF' }]}>${weeklySavings.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.customizeButton} onPress={() => { setCustomizeModalVisible(true); setHasCustomized(true); }}>
              <Text style={styles.customizeButtonText}>Customize Allocation</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isCustomizeModalVisible}
        onRequestClose={() => setCustomizeModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.header}>Customize Budget</Text>
            <View style={styles.allocationSummary}>
              <Text style={styles.summaryText}>Allocated: ${allocatedSum.toFixed(2)}</Text>
              <Text style={[styles.summaryText, { color: remainingToAllocate < 0 ? '#FF4136' : '#555' }]}>
                Remaining: ${remainingToAllocate.toFixed(2)}
              </Text>
            </View>

            {view === 'daily' && dailyBudgets.map((budget, index) => (
              <View key={index} style={styles.inputRow}>
                <Text style={styles.inputLabel}>{formatDateForDay(index)}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="$0.00"
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={(text) => handleBudgetChange(index, text)}
                />
              </View>
            ))}

            {view === 'weekly' && weeklyBudgets.map((budget, index) => (
              <View key={index} style={styles.inputRow}>
                <Text style={styles.inputLabel}>Week {index + 1}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="$0.00"
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={(text) => handleBudgetChange(index, text)}
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={() => setCustomizeModalVisible(false)}>
              <Text style={styles.buttonText}>Done Customizing</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSavingsModalVisible}
        onRequestClose={() => setSavingsModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Set Savings Goal</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="$0.00"
              keyboardType="numeric"
              value={savingsGoal}
              onChangeText={handleSavingsChange}
              autoFocus={true}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSavingsModalVisible(false)}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => setSavingsModalVisible(false)}
              >
                <Text style={styles.buttonText}>Set Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleDone}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' }, // Main screen container
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 40 }, // Modal container
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  scrollContainer: { padding: 20, alignItems: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 10, textAlign: 'center' },
  subHeader: { fontSize: 18, color: '#555', textAlign: 'center', marginBottom: 40 },
  bold: { fontWeight: 'bold', color: '#000000' },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 15,
    width: '45%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  selectedOptionText: { color: '#FFFFFF' },
  leftoverContainer: {
    width: '100%',
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#F9F9F9',
  },
  leftoverLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  leftoverAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  savingsButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  savingsButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  remainingText: { fontSize: 14, fontWeight: 'bold', marginTop: 5, color: '#555' },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  resultLabel: { fontSize: 20, color: '#555', marginBottom: 10 },
  resultAmount: { fontSize: 60, fontWeight: 'bold', color: '#32CD32' },
  customizeButton: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  customizeButtonText: {
    color: '#000000', fontSize: 16, fontWeight: 'bold'
  },
  resultRow: {
    alignItems: 'center',
    width: '100%',
  },
  allocationSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  summaryText: { fontSize: 16, fontWeight: 'bold' },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  inputLabel: { fontSize: 16, color: '#333' },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    fontSize: 16,
    paddingVertical: 5,
    minWidth: 100,
    textAlign: 'right',
  },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  button: { backgroundColor: '#000000', paddingVertical: 15, width: '100%', alignItems: 'center'},
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    fontSize: 24,
    paddingVertical: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 15,
    width: '48%',
    alignItems: 'center',
    borderRadius: 5,
  },
  saveButton: { backgroundColor: '#000000' },
  cancelButton: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#000000' },
  cancelButtonText: { color: '#000000' },
});