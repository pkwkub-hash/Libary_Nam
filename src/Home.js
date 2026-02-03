import React, { useState, useEffect } from "react";

const categories = [
  { id: "000", name: "ทั่วไป คอมพิวเตอร์", img: "/000.jpg" },
  { id: "100", name: "ปรัชญา", img: "/100.jpg" },
  { id: "200", name: "ศาสนา", img: "/200.jpg" },
  { id: "300", name: "สังคมศาสตร์", img: "/300.jpg" },
  { id: "400", name: "ภาษาศาสตร์", img: "/400.jpg" },
  { id: "500", name: "วิทยาศาสตร์", img: "/500.jpg" },
  { id: "600", name: "เทคโนโลยี", img: "/600.jpg" },
  { id: "700", name: "ศิลปะ", img: "/700.jpg" },
  { id: "800", name: "วรรณกรรม", img: "/800.jpg" },
  { id: "900", name: "ประวัติศาสตร์", img: "/900.jpg" },
];

export default function Home({ borrowCount, onNavigate, onSignOut, userRole }) {
  const [loadedCount, setLoadedCount] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // 📱 เช็คขนาดหน้าจอ (ถ้าเล็กกว่า 768px ถือเป็นมือถือ)
  const isMobile = window.innerWidth <= 768;

  const handleImageLoad = () => {
    setLoadedCount((prev) => prev + 1);
  };

  useEffect(() => {
    // รอโหลดรูปให้ครบ
    if (loadedCount >= categories.length) {
      const timer = setTimeout(() => setShowContent(true), 800);
      return () => clearTimeout(timer);
    }
  }, [loadedCount]);

  // เพิ่ม CSS hover effects
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      button[class*="menuBtn"]:hover,
      button[style*="menuBtn"]:hover {
        background: rgba(255,255,255,0.25) !important;
        transform: translateY(-2px);
      }
      
      button[class*="signOutBtn"]:hover,
      button[style*="signOutBtn"]:hover {
        background: rgba(239, 68, 68, 0.3) !important;
        transform: translateY(-2px);
      }

      div[style*="bookCard"]:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 30px rgba(0,0,0,0.15) !important;
      }

      button[style*="courseBtn"]:hover {
        background: #2d5a4d !important;
        transform: scale(1.05);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={styles.dashboardBg}>
      {/* Loading Overlay */}
      {!showContent && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>กำลังเตรียมข้อมูลห้องสมุด...</p>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div
        style={{
          ...styles.mainContainer,
          opacity: showContent ? 1 : 0,
          visibility: showContent ? "visible" : "hidden",
        }}
      >
        {/* Header ใหม่ที่สวยขึ้น */}
        <header style={styles.headerStyle}>
          <div style={styles.headerContent}>
            {/* Logo และชื่อระบบ */}
            <div style={styles.brand}>
              <div style={styles.logoCircle}>📚</div>
              <div>
                <h3 style={styles.headerTitle}>Library System</h3>
                <p style={styles.collegeName}>วิทยาลัยเทคนิคนนทบุรี</p>
              </div>
            </div>

            {/* เมนูด้านขวา */}
            <nav style={styles.navMenu}>
              <button
                onClick={() => onNavigate("media")}
                style={styles.menuBtn}
              >
                <span style={styles.menuIcon}>🌐</span>
                <span style={styles.menuText}>สื่อออนไลน์</span>
              </button>

              <button
                onClick={() => onNavigate("history")}
                style={styles.menuBtn}
              >
                <span style={styles.menuIcon}>📋</span>
                <span style={styles.menuText}>ประวัติ</span>
                {borrowCount > 0 && (
                  <span style={styles.badge}>{borrowCount}</span>
                )}
              </button>

              <button onClick={onSignOut} style={styles.signOutBtn}>
                <span style={styles.menuIcon}>🚪</span>
                <span style={styles.menuText}>ออกจากระบบ</span>
              </button>
            </nav>
          </div>
        </header>

        <div style={styles.contentWrapper}>
          <div style={styles.welcomeSection}>
            <h2
              style={{
                ...styles.welcomeText,
                fontSize: isMobile ? "20px" : "28px",
              }}
            >
              ยินดีต้อนรับสู่ห้องสมุด
            </h2>
            <p style={styles.subText}>กรุณาเลือกหมวดหมู่หนังสือที่ต้องการยืม</p>
          </div>

          <div
            style={{
              ...styles.bookGrid,
              gridTemplateColumns: isMobile
                ? "repeat(2, 1fr)" // 📱 มือถือ: 2 คอลัมน์
                : "repeat(5, 1fr)", // 💻 คอม: 5 คอลัมน์
            }}
          >
            {categories.map((cat) => (
              <div
                key={cat.id}
                style={styles.bookCard}
                onClick={() => onNavigate("borrow", cat.name)}
              >
                <div style={styles.imgContainer}>
                  <img
                    src={cat.img}
                    alt={cat.name}
                    style={styles.bookImg}
                    onLoad={handleImageLoad}
                    onError={handleImageLoad}
                  />
                </div>
                <div style={styles.bookInfo}>
                  <p style={styles.bookTitleText}>
                    {cat.id} - {cat.name}
                  </p>
                  <button style={styles.courseBtn}>ยืมหนังสือ</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  dashboardBg: { minHeight: "100vh", backgroundColor: "#f0f4f3" },
  mainContainer: { transition: "opacity 0.8s ease-in-out" },
  loadingOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "#ffffff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #1a3c34",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "20px",
    fontSize: "16px",
    color: "#1a3c34",
    fontWeight: "bold",
  },

  // ===== Header ใหม่ที่สวยขึ้น =====
  headerStyle: {
    background: "linear-gradient(135deg, #1a3c34 0%, #2d5a4d 100%)",
    color: "#fff",
    padding: "15px 20px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  headerContent: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  logoCircle: {
    width: "50px",
    height: "50px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    backdropFilter: "blur(10px)",
    border: "2px solid rgba(255,255,255,0.2)",
  },

  headerTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  },

  collegeName: {
    margin: "3px 0 0 0",
    fontSize: "12px",
    opacity: 0.85,
    fontWeight: "normal",
  },

  // ===== Navigation Menu =====
  navMenu: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  menuBtn: {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.3s ease",
    position: "relative",
  },

  menuIcon: {
    fontSize: "18px",
  },

  menuText: {
    whiteSpace: "nowrap",
  },

  badge: {
    position: "absolute",
    top: "-5px",
    right: "-5px",
    background: "#ef4444",
    color: "#fff",
    borderRadius: "10px",
    padding: "2px 7px",
    fontSize: "11px",
    fontWeight: "bold",
    minWidth: "20px",
    textAlign: "center",
  },

  signOutBtn: {
    background: "rgba(239, 68, 68, 0.2)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },

  // Content
  contentWrapper: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "30px 20px",
  },

  welcomeSection: {
    marginBottom: "30px",
    textAlign: "center",
  },

  welcomeText: {
    color: "#1a3c34",
    margin: "0 0 10px 0",
    fontWeight: "bold",
  },

  subText: {
    color: "#64748b",
    fontSize: "15px",
    margin: 0,
  },

  // Grid & Cards
  bookGrid: { display: "grid", gap: "20px" },
  bookCard: {
    background: "#fff",
    borderRadius: "20px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    transition: "all 0.3s ease",
  },
  imgContainer: {
    width: "100%",
    aspectRatio: "3/4",
    background: "#eee",
    overflow: "hidden",
  },
  bookImg: { width: "100%", height: "100%", objectFit: "cover" },
  bookInfo: { padding: "15px", textAlign: "center" },
  bookTitleText: {
    fontSize: "13px",
    fontWeight: "bold",
    color: "#1a3c34",
    marginBottom: "12px",
    height: "40px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  courseBtn: {
    background: "#1a3c34",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    width: "100%",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};
