import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Alert, Share, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TeacherScreen({ currentUser }) {
  const [refreshing, setRefreshing] = useState(false);
  const isAdmin = currentUser?.email === 'soemyintswe@gmail.com' || currentUser?.role === 'teacher';

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const teacherProfile = {
    name: 'ဦးစိုးမြင့်ဆွေ (U Soe Myint Swe)',
    degrees: 'B.Sc (Physics), Dip. in Education, MKS Edu Services Founder',
    expertise: 'Japanese Language (JLPT N3/N4/N5), Python Automation, Educational Management',
    experience: '၂၅ နှစ်ကျော် အစိုးရနှင့် ပညာရေးဝန်ဆောင်မှု လုပ်ငန်းအတွေ့အကြုံရှိသူ။',
    contact: 'soemyintswe@gmail.com | Yangon, Myanmar'
  };

  const [usersList, setUsersList] = useState([
    { id: '1', username: 'soe_student1', name: 'မောင်ထွန်းနိုင်စိုး', email: 'thunnain@gmail.com', phone: '09123456789', role: 'Student', tempPass: 'jp1234' },
    { id: '2', username: 'may_kyu', name: 'မေကြူ', email: 'maykyu@gmail.com', phone: '09987654321', role: 'Student', tempPass: 'jp5678' },
  ]);

  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Student');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const onShareApp = async () => {
    try {
      await Share.share({
        message: 'Japanese Study Planner အက်ပ်ကို အသုံးပြု၍ ဂျပန်စာလေ့လာမှုကို စနစ်တကျ စီမံကြပါစို့! Download link: https://mksedudoc.web.app',
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAdminCreateUser = () => {
    if (!newUsername.trim() || !newName.trim() || !newEmail.trim() || !newPhone.trim()) {
      Alert.alert('အမှား', 'Username, Name, Email နှင့် Phone ကို ဖြည့်သွင်းပါ။');
      return;
    }
    const tempPassword = Math.random().toString(36).slice(-6);
    const newUser = {
      id: Date.now().toString(),
      username: newUsername,
      name: newName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      tempPass: tempPassword
    };

    setUsersList([newUser, ...usersList]);
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPhone('');

    Alert.alert('အောင်မြင်သည်', `Username: ${newUsername}\nTemp Password: ${tempPassword}\nအကောင့်ဖန်တီးပြီး ယာယီစကားဝှက် ပို့ပြီးပါပြီ။`);
  };

  const handleChangePassword = () => {
    if (!oldPassword.trim() || !newPassword.trim()) {
      Alert.alert('အမှား', 'စကားဝှက်ဟောင်းနှင့် အသစ်ကို ဖြည့်သွင်းပါ။');
      return;
    }
    Alert.alert('အောင်မြင်သည်', 'သင်၏ Password ကို အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။');
    setOldPassword('');
    setNewPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPlanner}>
        <Text style={styles.headerTitleText}>
          {isAdmin ? '🛡️ Admin Panel & ဆရာ့ စီမံခန့်ခွဲမှု' : '🎓 ကျောင်းသား ဧရိယာ'}
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="ribbon" size={22} color="#D32F2F" />
            <Text style={styles.cardTitle}>ဆရာ့ ကိုယ်ရေးအကျဉ်းနှင့် အရည်အချင်းများ</Text>
          </View>
          <Text style={styles.bioName}>{teacherProfile.name}</Text>
          <Text style={styles.bioText}><Text style={styles.bold}>ဘွဲ့/ပညာအရည်အချင်း:</Text> {teacherProfile.degrees}</Text>
          <Text style={styles.bioText}><Text style={styles.bold}>ကျွမ်းကျင်မှု:</Text> {teacherProfile.expertise}</Text>
          <Text style={styles.bioText}><Text style={styles.bold}>အတွေ့အကြုံ:</Text> {teacherProfile.experience}</Text>
          <Text style={styles.bioText}><Text style={styles.bold}>ဆက်သွယ်ရန်:</Text> {teacherProfile.contact}</Text>
        </View>

        <TouchableOpacity style={styles.shareBanner} onPress={onShareApp}>
          <Ionicons name="share-social-outline" size={24} color="#FFF" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.shareBannerTitle}>App ကို မျှဝေသုံးစွဲရန်</Text>
            <Text style={styles.shareBannerSub}>ဤ Study Planner အက်ပ်ကို အခြားသူများထံ မျှဝေရန် နှိပ်ပါ</Text>
          </View>
        </TouchableOpacity>

        {isAdmin && (
          <View style={styles.adminCard}>
            <Text style={[styles.cardTitle, { color: '#D32F2F' }]}>ADMIN PANEL - User Management</Text>
            
            <Text style={styles.label}>Username:</Text>
            <TextInput style={styles.input} placeholder="username" value={newUsername} onChangeText={setNewUsername} />

            <Text style={styles.label}>Full Name:</Text>
            <TextInput style={styles.input} placeholder="အမည်ပြည့်စုံ" value={newName} onChangeText={setNewName} />

            <Text style={styles.label}>Email:</Text>
            <TextInput style={styles.input} placeholder="email@gmail.com" value={newEmail} onChangeText={setNewEmail} />

            <Text style={styles.label}>Phone Number:</Text>
            <TextInput style={styles.input} placeholder="09xxxxxxxxx" value={newPhone} onChangeText={setNewPhone} />

            <TouchableOpacity style={styles.addStudentBtn} onPress={handleAdminCreateUser}>
              <Text style={styles.addStudentBtnText}>အကောင့်ဖန်တီးပြီး ယာယီစကားဝှက် ပို့မည်</Text>
            </TouchableOpacity>

            <Text style={[styles.cardTitle, { marginTop: 20 }]}>👥 အကောင့်များ စာရင်း ({usersList.length})</Text>
            {usersList.map((usr) => (
              <View key={usr.id} style={styles.studentItem}>
                <View>
                  <Text style={styles.studentName}>{usr.name} ({usr.username})</Text>
                  <Text style={styles.studentDate}>📧 {usr.email} | 📞 {usr.phone}</Text>
                  <Text style={{ fontSize: 11, color: '#D32F2F' }}>Temp Password: {usr.tempPass}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Change Password Card with Show Password */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔑 စကားဝှက် ပြင်ဆင်ရန် (Change Password)</Text>
          
          <Text style={styles.label}>စကားဝှက်ဟောင်း (Old Password):</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Old Password" 
              value={oldPassword} 
              onChangeText={setOldPassword} 
              secureTextEntry={!showOldPass} 
            />
            <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)} style={styles.eyeIcon}>
              <Ionicons name={showOldPass ? "eye-off" : "eye"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>စကားဝှက်အသစ် (New Password):</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="New Password" 
              value={newPassword} 
              onChangeText={setNewPassword} 
              secureTextEntry={!showNewPass} 
            />
            <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeIcon}>
              <Ionicons name={showNewPass ? "eye-off" : "eye"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.changePassBtn} onPress={handleChangePassword}>
            <Text style={styles.changePassBtnText}>စကားဝှက် ပြောင်းလဲမည်</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerPlanner: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  headerTitleText: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  scrollContainer: { padding: 15 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, marginBottom: 15, elevation: 3 },
  adminCard: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFCDD2', borderRadius: 12, padding: 18, marginBottom: 15, elevation: 3 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  bioName: { fontSize: 17, fontWeight: 'bold', color: '#D32F2F', marginBottom: 6 },
  bioText: { fontSize: 13, color: '#555', marginBottom: 4, lineHeight: 18 },
  bold: { fontWeight: 'bold', color: '#333' },
  shareBanner: { backgroundColor: '#1976D2', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 2 },
  shareBannerTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  shareBannerSub: { color: '#E3F2FD', fontSize: 12, marginTop: 2 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#333', backgroundColor: '#FAFAFA', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5 },
  passwordContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, alignItems: 'center', backgroundColor: '#FAFAFA', marginBottom: 10 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#333' },
  eyeIcon: { padding: 10 },
  addStudentBtn: { backgroundColor: '#388E3C', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  addStudentBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  changePassBtn: { backgroundColor: '#1976D2', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  changePassBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  studentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FFCDD2' },
  studentName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  studentDate: { fontSize: 11, color: '#666', marginTop: 2 },
});