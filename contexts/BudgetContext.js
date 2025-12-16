import React, { createContext, useState, useContext } from 'react';

const BudgetContext = createContext();

export const useBudget = () => useContext(BudgetContext);

export const BudgetProvider = ({ children }) => {
  const [budgetDetails, setBudgetDetails] = useState(null);

  return (
    <BudgetContext.Provider value={{ budgetDetails, setBudgetDetails }}>
      {children}
    </BudgetContext.Provider>
  );
};