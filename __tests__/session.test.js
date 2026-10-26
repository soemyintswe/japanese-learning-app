jest.mock('../src/firebase', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  deleteDoc: jest.fn(async () => {}),
  doc: jest.fn((_db, collectionName, id) => ({ id, collectionName })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((...args) => args),
  setDoc: jest.fn(async () => {}),
  where: jest.fn((...args) => args),
}));

import { getDoc, getDocs, setDoc } from 'firebase/firestore';
import { adoptProfile, resolveProfileDefaults, resolveUserProfile } from '../src/session';

describe('user profile resolution', () => {
  test('uses active defaults for the administrator and pending defaults for a student', () => {
    expect(resolveProfileDefaults({ email: 'SOEMYINTSWE@GMAIL.COM' }).profile.status).toBe('active');
    expect(resolveProfileDefaults({ email: 'learner@example.com' }).profile.status).toBe('pending');
  });

  test('adopts placeholder role, status, and profile fields', () => {
    const adopted = adoptProfile({ name: 'Learner', role: 'TEACHER', status: 'ACTIVE', phone: '09' }, { name: 'Fallback', role: 'student', status: 'pending' });
    expect(adopted.profile).toEqual({ name: 'Learner', role: 'teacher', status: 'active' });
    expect(adopted.extras.phone).toBe('09');
  });

  test('resolveUserProfile creates the UID profile from a matching email placeholder', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false }).mockResolvedValueOnce({ exists: () => false });
    getDocs.mockResolvedValueOnce({ forEach: () => {} })
      .mockResolvedValueOnce({ forEach: () => {} })
      .mockResolvedValueOnce({ forEach: (fn) => fn({ id: 'user_1', data: () => ({ name: 'Learner', email: 'learner@example.com', role: 'teacher', status: 'active' }) }) })
      .mockResolvedValueOnce({ forEach: () => {} });
    const result = await resolveUserProfile({ uid: 'uid-1', email: 'learner@example.com', providerData: [] });
    expect(result).toMatchObject({ name: 'Learner', role: 'teacher', status: 'active', firestoreOk: true });
    expect(setDoc).toHaveBeenCalled();
  });
});
