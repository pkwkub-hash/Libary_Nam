import React from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Register({ onBack }) {
  const handleRegister = async (e) => {
    e.preventDefault();
    const { email, password, name, studentId, level, department } =
      e.target.elements;

    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );

      // บันทึกข้อมูลลง Firestore พร้อม 'ระดับชั้น'
      await setDoc(doc(db, "users", res.user.uid), {
        name: name.value,
        studentId: studentId.value,
        level: level.value, // 🔥 เก็บระดับชั้น เช่น ปวส. 2
        department: department.value,
        email: email.value,
        role: "user",
        borrows: [],
        createdAt: new Date().toISOString(),
      });

      alert("สมัครสมาชิกสำเร็จ!");
      onBack();
    } catch (err) {
      alert("สมัครไม่สำเร็จ: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ color: "#1a3c34", marginBottom: "20px" }}>Register</h2>
        <form
          onSubmit={handleRegister}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <input
            name="name"
            placeholder="ชื่อ-นามสกุล"
            style={styles.input}
            required
          />
          <input
            name="studentId"
            placeholder="รหัสนักศึกษา"
            style={styles.input}
            required
          />
          {/* 🔥 ช่องกรอกระดับชั้นเพิ่มใหม่ */}
          <input
            name="level"
            placeholder="ระดับชั้น"
            style={styles.input}
            required
          />
          <input
            name="department"
            placeholder="แผนกวิชา"
            style={styles.input}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            style={styles.input}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password (6 ตัวขึ้นไป)"
            style={styles.input}
            required
          />

          <button type="submit" style={styles.btn}>
            ยืนยันสมัครสมาชิก
          </button>
          <button type="button" onClick={onBack} style={styles.link}>
            กลับไปหน้า Login
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f0f2f5",
    padding: "20px",
  },
  card: {
    background: "#fff",
    padding: "30px",
    borderRadius: "25px",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  },
  input: {
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    fontSize: "15px",
    width: "100%",
    boxSizing: "border-box",
  },
  btn: {
    padding: "15px",
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    borderRadius: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  link: {
    background: "none",
    border: "none",
    color: "#666",
    cursor: "pointer",
    marginTop: "10px",
  },
};
