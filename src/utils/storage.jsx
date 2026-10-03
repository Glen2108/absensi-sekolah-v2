const STUDENT_KEY = 'absensi_student_session';
const ATTENDANCE_KEY = 'absensi_records';

export const getStudentSession = () => {
  const data = localStorage.getItem(STUDENT_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveStudentSession = (student) => {
  localStorage.setItem(STUDENT_KEY, JSON.stringify(student));
};

export const clearStudentSession = () => {
  localStorage.removeItem(STUDENT_KEY);
};

export const getAttendanceRecords = () => {
  const data = localStorage.getItem(ATTENDANCE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAttendanceRecord = (record) => {
  const records = getAttendanceRecords();
  records.unshift(record); // Tambahkan data terbaru di posisi teratas
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  return records;
};

export const updateAttendanceRecord = (updatedRecord) => {
  let records = getAttendanceRecords();
  records = records.map(item => item.id === updatedRecord.id ? updatedRecord : item);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  return records;
};

export const deleteAttendanceRecord = (id) => {
  let records = getAttendanceRecords();
  records = records.filter(item => item.id !== id);
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
  return records;
};