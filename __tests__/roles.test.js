jest.mock('../src/session', () => ({ ADMIN_EMAIL: 'soemyintswe@gmail.com' }));

import { isAdmin, isSuperAdmin, isTeacher } from '../src/roles';

describe('role checks', () => {
  test('recognizes admin role and configured super-admin email case-insensitively', () => {
    expect(isAdmin({ role: 'ADMIN' })).toBe(true);
    expect(isSuperAdmin({ email: 'SOEMYINTSWE@GMAIL.COM' })).toBe(true);
  });

  test('recognizes teacher without granting admin access', () => {
    const user = { role: 'teacher', email: 'teacher@example.com' };
    expect(isTeacher(user)).toBe(true);
    expect(isAdmin(user)).toBe(false);
  });
});
