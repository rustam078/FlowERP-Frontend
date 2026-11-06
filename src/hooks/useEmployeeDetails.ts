import { useQuery } from '@tanstack/react-query';
import { employeeDetailsService } from '../services/employee-details.service';

/**
 * React Query hook to fetch details for a specific employee.
 * Integrates optional date range filters as part of the query key.
 */
export const useEmployeeDetails = (
  employeeId: string,
  fromDate?: string,
  toDate?: string
) => {
  return useQuery({
    queryKey: ['employeeDetails', employeeId, fromDate, toDate],
    queryFn: () =>
      employeeDetailsService.getEmployeeDetails(employeeId, fromDate, toDate),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache validity
  });
};

/**
 * React Query hook to fetch calendar data for a specific employee.
 */
export const useEmployeeCalendar = (
  employeeId: string,
  fromDate?: string,
  toDate?: string
) => {
  return useQuery({
    queryKey: ['employeeCalendar', employeeId, fromDate, toDate],
    queryFn: () =>
      employeeDetailsService.getEmployeeCalendar(employeeId, fromDate, toDate),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache validity
  });
};

