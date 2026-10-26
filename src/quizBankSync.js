import { addDoc, collection, getDocs, query, serverTimestamp, updateDoc, where, doc } from 'firebase/firestore';
import { db } from './firebase';

const questionsRef = () => collection(db, 'quizQuestions');

export async function loadQuizQuestions(user, staff) {
  if (!user || !user.uid) return { approved: [], own: [], pending: [] };
  const jobs = [getDocs(query(questionsRef(), where('status', '==', 'approved')))];
  jobs.push(getDocs(query(questionsRef(), where('submittedBy', '==', user.uid))));
  if (staff) jobs.push(getDocs(query(questionsRef(), where('status', '==', 'pending'))));
  const [approvedSnap, ownSnap, pendingSnap] = await Promise.all(jobs);
  const rows = (snap) => snap ? snap.docs.map((item) => ({ ...item.data(), id: item.data().questionId || item.id, firestoreId: item.id })) : [];
  return { approved: rows(approvedSnap), own: rows(ownSnap), pending: rows(pendingSnap) };
}

export async function submitQuizQuestion(user, question) {
  if (!user || !user.uid) throw new Error('sign-in-required');
  const { id: _id, status: _status, ...data } = question;
  return addDoc(questionsRef(), {
    ...data,
    questionId: question.id,
    submittedBy: user.uid,
    status: 'pending',
    submittedAt: serverTimestamp(),
  });
}

export async function moderateQuizQuestion(questionId, status) {
  if (!['approved', 'rejected'].includes(status)) throw new Error('invalid-moderation-status');
  return updateDoc(doc(db, 'quizQuestions', questionId), { status });
}
