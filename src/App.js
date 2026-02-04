import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";


import Home from "./Home";
import BorrowBook from "./BorrowBook";
import History from "./History";
import Register from "./Register";
import Admin from "./Admin";
import Staff from "./Staff";
import OnlineMedia from "./OnlineMedia";


const SUPER_ADMINS = ["admin@gmail.com"];

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [borrows, setBorrows] = useState([]);

  
  const [activePage, setActivePage] = useState("home");
  const [selectedCat, setSelectedCat] = useState(null);

  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Modal States
  const [alertModal, setAlertModal] = useState({
    show: false,
    title: "",
    msg: "",
    type: "normal",
  });
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setIsLoadingProfile(true);

        // 1. Super Admin Hardcode Check
        let isSuperAdmin = SUPER_ADMINS.includes(u.email);

        // 2. Database Check
        const userRef = doc(db, "users", u.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
          await setDoc(userRef, {
            email: u.email,
            role: isSuperAdmin ? "admin" : "user",
            borrows: [],
            name: u.email.split("@")[0],
          });
        }

        const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBorrows(data.borrows || []);
            const role = isSuperAdmin
              ? "admin"
              : (data.role || "user").toLowerCase();
            setUserRole(role);
          }
          setIsLoadingProfile(false);
        });

        return () => unsubscribeDoc();
      } else {
        setIsLoadingProfile(false);
        setUserRole("user");
        setActivePage("home");
        setBorrows([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const showAlert = (title, msg, type = "normal") => {
    setAlertModal({ show: true, title, msg, type });
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) return showAlert("แจ้งเตือน", "กรุณากรอกอีเมล", "error");
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setShowForgot(false);
      showAlert("สำเร็จ", "ส่งลิงก์รีเซ็ตรหัสแล้วครับ ✅");
    } catch (err) {
      showAlert("ผิดพลาด", err.message, "error");
    }
  };

  // --- Login Section ---
  if (!user) {
    if (isRegistering)
      return <Register onBack={() => setIsRegistering(false)} />;
    return (
      <div style={styles.loginBg}>
        <div style={styles.loginCard}>
          <h1 style={styles.loginTitle}>Sign In</h1>
          <p style={styles.collegeName}>NONTHABURI TECHNICAL COLLEGE</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await signInWithEmailAndPassword(
                  auth,
                  e.target.email.value,
                  e.target.password.value
                );
              } catch (err) {
                showAlert("ไม่สำเร็จ", "อีเมลหรือรหัสผ่านผิด", "error");
              }
            }}
          >
            <input
              name="email"
              style={styles.input}
              type="email"
              placeholder="Email"
              required
            />
            <input
              name="password"
              style={styles.input}
              type="password"
              placeholder="Password"
              required
            />
            <button style={styles.primaryBtn} type="submit">
              Sign In
            </button>
          </form>
          <p onClick={() => setShowForgot(true)} style={styles.link}>
            ลืมรหัสผ่าน?
          </p>
          <p style={{ marginTop: "15px", fontSize: "13px", color: "#666" }}>
            ยังไม่มีบัญชี?{" "}
            <span onClick={() => setIsRegistering(true)} style={styles.link}>
              สมัครสมาชิก
            </span>
          </p>
        </div>

        {showForgot && (
          <div style={styles.overlay}>
            <div style={styles.popupBox}>
              <h3 style={styles.popupTitle}>🔑 รีเซ็ตรหัสผ่าน</h3>
              <input
                style={styles.input}
                placeholder="ระบุอีเมล..."
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <div style={styles.popupBtnGroup}>
                <button
                  onClick={() => setShowForgot(false)}
                  style={styles.btnCancel}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleForgotPassword}
                  style={styles.btnConfirm}
                >
                  ส่งลิงก์
                </button>
              </div>
            </div>
          </div>
        )}

        {alertModal.show && (
          <div style={styles.overlay}>
            <div style={styles.popupBox}>
              <h3
                style={
                  alertModal.type === "error"
                    ? styles.titleError
                    : styles.popupTitle
                }
              >
                {alertModal.title}
              </h3>
              <p style={{ color: "#555", marginBottom: "20px" }}>
                {alertModal.msg}
              </p>
              <button
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                style={styles.btnFull}
              >
                ตกลง
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isLoadingProfile)
    return <div style={styles.loading}>กำลังโหลดข้อมูล...</div>;

  // 👑 ADMIN - แสดงเฉพาะหน้า Admin Dashboard เท่านั้น
  if (userRole === "admin") {
    return (
      <div>
        <div style={styles.roleBar}>Login: {user.email} | Role: ADMIN 👑</div>
        <Admin user={user} role={userRole} onSignOut={() => signOut(auth)} />
      </div>
    );
  }

  // 👔 STAFF - แสดงเฉพาะหน้า Staff Dashboard เท่านั้น
  if (userRole === "staff") {
    return (
      <div>
        <div style={styles.roleBar}>Login: {user.email} | Role: STAFF 👔</div>
        <Staff user={user} role={userRole} onSignOut={() => signOut(auth)} />
      </div>
    );
  }

  // 👤 USER - แสดงหน้า Home, BorrowBook, History, OnlineMedia
  return (
    <div>
      <div style={styles.roleBar}>Login: {user.email} | Role: USER 👤</div>

      {activePage === "home" && (
        <Home
          userRole={userRole}
          borrowCount={borrows.length}
          onSignOut={() => signOut(auth)}
          onNavigate={(page, cat) => {
            setActivePage(page);
            setSelectedCat(cat);
          }}
        />
      )}

      {activePage === "borrow" && (
        <BorrowBook
          user={user}
          category={selectedCat}
          onBack={() => setActivePage("home")}
        />
      )}

      {activePage === "history" && (
        <History userId={user.uid} onBack={() => setActivePage("home")} />
      )}

      {activePage === "media" && (
        <OnlineMedia onBack={() => setActivePage("home")} />
      )}
    </div>
  );
}

const styles = {
  roleBar: {
    background: "#000",
    color: "#fff",
    padding: "5px",
    fontSize: "10px",
    textAlign: "center",
  },
  loginBg: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(rgba(26,60,52,0.8), rgba(0,0,0,0.9)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000')",
    backgroundSize: "cover",
  },
  loginCard: {
    background: "#fff",
    padding: "40px",
    borderRadius: "30px",
    width: "90%",
    maxWidth: "350px",
    textAlign: "center",
  },
  loginTitle: { color: "#1a3c34", marginBottom: "10px" },
  collegeName: { color: "#666", fontSize: "12px", marginBottom: "20px" },
  input: {
    width: "100%",
    padding: "12px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    marginBottom: "10px",
    boxSizing: "border-box",
    fontSize: "16px",
  },
  primaryBtn: {
    width: "100%",
    padding: "15px",
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "16px",
  },
  link: {
    color: "#1a3c34",
    cursor: "pointer",
    textDecoration: "underline",
    fontWeight: "bold",
  },
  loading: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1a3c34",
    fontSize: "18px",
    fontWeight: "bold",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(3px)",
  },
  popupBox: {
    background: "#fff",
    width: "85%",
    maxWidth: "320px",
    padding: "25px",
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  },
  popupTitle: { color: "#1a3c34", margin: "0 0 10px 0", fontSize: "20px" },
  titleError: { color: "#dc2626", margin: "0 0 10px 0", fontSize: "20px" },
  popupBtnGroup: { display: "flex", gap: "10px", marginTop: "15px" },
  btnCancel: {
    flex: 1,
    padding: "10px",
    background: "#f3f4f6",
    color: "#333",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
  },
  btnConfirm: {
    flex: 1,
    padding: "10px",
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
  },
  btnFull: {
    width: "100%",
    padding: "10px",
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "bold",
  },
};
