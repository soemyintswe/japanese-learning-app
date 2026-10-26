import { ADMIN_EMAIL } from './session';

const roleOf = (user) => String((user && user.role) || '').toLowerCase();

export function isSuperAdmin(user) {
  return String((user && user.email) || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function isAdmin(user) {
  return roleOf(user) === 'admin' || isSuperAdmin(user);
}

export function isTeacher(user) {
  return roleOf(user) === 'teacher';
}
