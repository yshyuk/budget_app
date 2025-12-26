import type { Budget } from '../types/database';

interface BudgetProgressProps {
  budget: Budget;
  actual: {
    income: number;
    expense: number;
    saving: number;
  };
}

export default function BudgetProgress({ budget, actual }: BudgetProgressProps) {
  const incomePercentage = budget.income_budget > 0
    ? Math.min((actual.income / budget.income_budget) * 100, 100)
    : 0;

  const expensePercentage = budget.expense_budget > 0
    ? Math.min((actual.expense / budget.expense_budget) * 100, 100)
    : 0;

  const savingPercentage = budget.saving_budget > 0
    ? Math.min((actual.saving / budget.saving_budget) * 100, 100)
    : 0;

  const getProgressColor = (percentage: number, type: 'income' | 'expense' | 'saving') => {
    if (type === 'income') {
      if (percentage >= 100) return 'bg-green-600';
      if (percentage >= 70) return 'bg-green-500';
      return 'bg-green-400';
    }

    if (type === 'expense') {
      if (percentage >= 100) return 'bg-red-600';
      if (percentage >= 80) return 'bg-orange-500';
      return 'bg-blue-500';
    }

    if (type === 'saving') {
      if (percentage >= 100) return 'bg-blue-600';
      if (percentage >= 70) return 'bg-blue-500';
      return 'bg-blue-400';
    }

    return 'bg-gray-400';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">
          {budget.year}년 {budget.month}월 예산 현황
        </h3>
      </div>

      <div className="space-y-6">
        {/* 수입 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">수입</span>
            <span className="text-sm text-gray-600">
              {actual.income.toLocaleString()} / {budget.income_budget.toLocaleString()}원
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${getProgressColor(
                incomePercentage,
                'income'
              )}`}
              style={{ width: `${incomePercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {incomePercentage.toFixed(1)}% 달성
          </p>
        </div>

        {/* 지출 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">지출</span>
            <span className="text-sm text-gray-600">
              {actual.expense.toLocaleString()} / {budget.expense_budget.toLocaleString()}원
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${getProgressColor(
                expensePercentage,
                'expense'
              )}`}
              style={{ width: `${expensePercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {expensePercentage.toFixed(1)}% 사용
            {expensePercentage >= 100 && (
              <span className="ml-2 text-red-600 font-semibold">⚠️ 초과!</span>
            )}
          </p>
        </div>

        {/* 저축 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">저축</span>
            <span className="text-sm text-gray-600">
              {actual.saving.toLocaleString()} / {budget.saving_budget.toLocaleString()}원
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${getProgressColor(
                savingPercentage,
                'saving'
              )}`}
              style={{ width: `${savingPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-right">
            {savingPercentage.toFixed(1)}% 달성
          </p>
        </div>
      </div>

      {/* 요약 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">남은 예산</p>
            <p className="text-lg font-semibold text-gray-900">
              {(budget.expense_budget - actual.expense).toLocaleString()}원
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">저축 필요액</p>
            <p className="text-lg font-semibold text-blue-600">
              {(budget.saving_budget - actual.saving).toLocaleString()}원
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
