import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

type StudentState = {
  id: string;
  userId: string;
  assessmentCompleted: boolean;
  reportGenerated: boolean;
  learningPathGenerated: boolean;
  currentTopicId: string | null;
  level: string;
  name: string;
};

type AuthContextType = {
  student: StudentState | null;
  loading: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshStudentState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [student, setStudent] = useState<StudentState | null>(null);
  const [loading, setLoading] = useState(true);

  // For prototype, we'll store the studentId in localStorage
  useEffect(() => {
    const savedId = localStorage.getItem('demo_student_id');
    if (savedId) {
      loadStudent(savedId).catch((err) => {
        console.error("Auto-login failed:", err);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const loadStudent = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('Student')
        .select(`
          id, userId, assessmentCompleted, reportGenerated, learningPathGenerated, currentTopicId, level,
          User (name)
        `)
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setStudent({
          id: data.id,
          userId: data.userId,
          assessmentCompleted: data.assessmentCompleted,
          reportGenerated: data.reportGenerated,
          learningPathGenerated: data.learningPathGenerated,
          currentTopicId: data.currentTopicId,
          level: data.level,
          name: Array.isArray(data.User) ? data.User[0]?.name : (data.User as any)?.name,
        });
      } else {
        throw new Error("Student data not found");
      }
    } catch (err) {
      console.error("Failed to load student state", err);
      localStorage.removeItem('demo_student_id');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, pass: string) => {
    if (username !== 'Ram' || pass !== '1234') {
      throw new Error("Invalid credentials. Try Ram / 1234");
    }

    setLoading(true);
    try {
      // 1. Check if Ram exists in User table
      let { data: user, error: userError } = await supabase
        .from('User')
        .select('id, name')
        .eq('name', 'Ram')
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 is not found
        throw userError;
      }

      let activeUser = user;
      if (!activeUser) {
        // Create User
        const { data: newUser, error: createError } = await supabase
          .from('User')
          .insert({ 
            id: crypto.randomUUID(),
            name: 'Ram', 
            email: 'ram@demo.com', 
            passwordHash: 'hashed_1234', 
            role: 'student' 
          })
          .select()
          .single();
        
        if (createError) throw createError;
        activeUser = newUser;

        // Create Student
        const { data: newStudent, error: studentError } = await supabase
          .from('Student')
          .insert({ 
            id: crypto.randomUUID(),
            userId: activeUser.id, 
            level: 'beginner' 
          })
          .select()
          .single();
          
        if (studentError) throw studentError;
        
        localStorage.setItem('demo_student_id', newStudent.id);
        await loadStudent(newStudent.id);
      } else {
        // Find existing Student
        const { data: existingStudent, error: getStudentError } = await supabase
          .from('Student')
          .select('id')
          .eq('userId', activeUser.id)
          .single();
          
        if (getStudentError) throw getStudentError;
        
        localStorage.setItem('demo_student_id', existingStudent.id);
        await loadStudent(existingStudent.id);
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('demo_student_id');
    setStudent(null);
  };

  const refreshStudentState = async () => {
    if (student?.id) {
      await loadStudent(student.id);
    }
  };

  return (
    <AuthContext.Provider value={{ student, loading, login, logout, refreshStudentState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
