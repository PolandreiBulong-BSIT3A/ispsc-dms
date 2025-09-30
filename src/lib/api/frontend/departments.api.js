import { buildUrl, fetchJson } from './client.js';

export const fetchDepartments = async () => {
  const data = await fetchJson(buildUrl('/departments'));
  return data.departments || [];
};

export const getFallbackDepartments = () => ([
  { value: '1', label: 'College of Arts and Sciences', code: 'CAS' },
  { value: '2', label: 'College of Management and Business Economics', code: 'CMBE' },
  { value: '3', label: 'College of Teacher Education', code: 'CTE' },
  { value: '4', label: 'Laboratory High School', code: 'LHS' },
  { value: '5', label: 'Non-Teaching Personnel', code: 'NON-TEACHING' },
  { value: '6', label: 'Graduate School', code: 'GRADUATE SCHOOL' },
  { value: '7', label: 'Student Council', code: 'STUDENT COUNCIL' },
]);
